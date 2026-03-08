import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

const OverlayElement = ({ element, isSelected, onSelect, onUpdate, onDelete, zoom }) => {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [startElem, setStartElem] = useState(null);

  const style = {
    position: 'absolute',
    left: element.x * zoom,
    top: element.y * zoom,
    width: element.width * zoom,
    height: element.height * zoom,
    opacity: element.opacity ?? 1,
    transform: `rotate(${element.rotation || 0}deg)`,
    cursor: dragging ? 'grabbing' : 'grab',
    zIndex: isSelected ? 100 : 10,
    outline: isSelected ? '2px solid #FFD447' : 'none',
    boxSizing: 'border-box',
  };

  const handleMouseDown = useCallback((e) => {
    if (e.target.classList.contains('resize-handle')) return;
    e.stopPropagation();
    onSelect(element.id);
    if (editing) return;
    setDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartElem({ x: element.x, y: element.y });
  }, [editing, element, onSelect]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !startPos) return;
    const dx = (e.clientX - startPos.x) / zoom;
    const dy = (e.clientY - startPos.y) / zoom;
    onUpdate(element.id, { ...element, x: startElem.x + dx, y: startElem.y + dy });
  }, [dragging, startPos, startElem, zoom, element, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    setResizing(false);
    setStartPos(null);
    setStartElem(null);
  }, []);

  useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, resizing, handleMouseMove, handleMouseUp]);

  const handleResizeMouseDown = (e, direction) => {
    e.stopPropagation();
    setResizing(direction);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartElem({ x: element.x, y: element.y, width: element.width, height: element.height });
  };

  // Render by type
  const renderContent = () => {
    const fontStyle = {
      fontSize: (element.fontSize || 16) * zoom,
      fontFamily: element.fontFamily || 'DM Sans',
      color: element.color || '#0D0D0D',
      fontWeight: element.bold ? 'bold' : 'normal',
      fontStyle: element.italic ? 'italic' : 'normal',
      textDecoration: element.underline ? 'underline' : 'none',
      textAlign: element.textAlign || 'left',
      width: '100%',
      height: '100%',
    };

    switch (element.type) {
      case 'text':
        return editing ? (
          <textarea
            autoFocus
            value={element.content || ''}
            onChange={e => onUpdate(element.id, { ...element, content: e.target.value })}
            onBlur={() => setEditing(false)}
            style={{ ...fontStyle, background: 'rgba(255,255,255,0.85)', border: 'none', outline: 'none', resize: 'none', padding: '2px 4px', borderRadius: '2px' }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <div
            onDoubleClick={() => setEditing(true)}
            style={{ ...fontStyle, padding: '2px 4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', userSelect: 'none' }}
          >
            {element.content || 'Double-click to edit'}
          </div>
        );

      case 'note':
        return (
          <div style={{ width: '100%', height: '100%', background: '#FFD447', borderRadius: '4px', padding: '8px', boxShadow: '2px 2px 6px rgba(0,0,0,0.2)', position: 'relative' }}>
            {editing ? (
              <textarea
                autoFocus
                value={element.content || ''}
                onChange={e => onUpdate(element.id, { ...element, content: e.target.value })}
                onBlur={() => setEditing(false)}
                style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: (element.fontSize || 13) * zoom, fontFamily: 'DM Sans', color: '#0D0D0D' }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <div onDoubleClick={() => setEditing(true)} style={{ fontSize: (element.fontSize || 13) * zoom, fontFamily: 'DM Sans', color: '#0D0D0D', whiteSpace: 'pre-wrap', wordBreak: 'break-word', userSelect: 'none', height: '100%', overflow: 'hidden' }}>
                {element.content || '📝 Double-click to edit'}
              </div>
            )}
          </div>
        );

      case 'rectangle':
        return (
          <div style={{
            width: '100%', height: '100%',
            background: element.fill && element.fill !== 'transparent' ? element.fill : 'transparent',
            border: `${(element.strokeWidth || 2) * zoom}px solid ${element.color || '#E84B2B'}`,
            borderRadius: element.radius ? `${element.radius * zoom}px` : 0,
          }} />
        );

      case 'ellipse':
        return (
          <div style={{
            width: '100%', height: '100%',
            background: element.fill && element.fill !== 'transparent' ? element.fill : 'transparent',
            border: `${(element.strokeWidth || 2) * zoom}px solid ${element.color || '#E84B2B'}`,
            borderRadius: '50%',
          }} />
        );

      case 'line':
        return (
          <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
            <line x1="0" y1={element.height * zoom / 2} x2={element.width * zoom} y2={element.height * zoom / 2}
              stroke={element.color || '#E84B2B'} strokeWidth={(element.strokeWidth || 2) * zoom} strokeLinecap="round" />
          </svg>
        );

      case 'highlight':
        return (
          <div style={{
            width: '100%', height: '100%',
            background: element.color || '#FFD447',
            opacity: 0.4,
            mixBlendMode: 'multiply',
          }} />
        );

      case 'image':
        return element.src ? (
          <img src={element.src} alt="overlay" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }} draggable={false} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'rgba(232,75,43,0.1)', border: '2px dashed #E84B2B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E84B2B', fontSize: 12 }}>
            No image
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div ref={ref} style={style} onMouseDown={handleMouseDown}>
      {renderContent()}

      {/* Delete button */}
      {isSelected && (
        <button
          onMouseDown={e => { e.stopPropagation(); onDelete(element.id); }}
          style={{
            position: 'absolute', top: -10, right: -10,
            width: 20, height: 20, borderRadius: '50%',
            background: '#E84B2B', color: '#F5F0E8',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          }}
        >
          <X size={10} strokeWidth={3} />
        </button>
      )}

      {/* Resize handles */}
      {isSelected && ['se', 'sw', 'ne', 'nw'].map(dir => (
        <div
          key={dir}
          className="resize-handle"
          onMouseDown={e => handleResizeMouseDown(e, dir)}
          style={{
            position: 'absolute',
            width: 10, height: 10,
            background: '#FFD447',
            border: '2px solid #0D0D0D',
            borderRadius: 2,
            cursor: `${dir}-resize`,
            zIndex: 201,
            ...(dir === 'se' ? { bottom: -5, right: -5 } :
               dir === 'sw' ? { bottom: -5, left: -5 } :
               dir === 'ne' ? { top: -5, right: -5 } :
                              { top: -5, left: -5 }),
          }}
        />
      ))}
    </div>
  );
};

export default OverlayElement;
