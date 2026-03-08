import React from 'react';
import {
  Type, ImagePlus, Highlighter, Pen, Square, Circle,
  Minus, Undo2, Redo2, Download, Trash2, MousePointer,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight, StickyNote,
  Eraser
} from 'lucide-react';

const Divider = () => (
  <div className="w-px h-6 mx-1" style={{ background: 'rgba(245,240,232,0.12)' }} />
);

const ToolBtn = ({ icon: Icon, label, active, onClick, disabled, color }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    data-tooltip={label}
    className={`toolbar-btn w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 ${
      active ? 'ring-1' : ''
    } ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10'}`}
    style={{
      background: active ? 'rgba(232,75,43,0.2)' : 'transparent',
      color: active ? '#E84B2B' : (color || '#8C8680'),
      ringColor: active ? '#E84B2B' : 'transparent',
    }}
  >
    <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
  </button>
);

const Toolbar = ({
  activeTool, setActiveTool,
  onUndo, onRedo, canUndo, canRedo,
  onExport, onDeleteSelected,
  zoom, onZoomIn, onZoomOut,
  currentPage, totalPages, onPageChange,
  onAddImage,
}) => {

  const tools = [
    { id: 'select', icon: MousePointer, label: 'Select (V)' },
    { id: 'text', icon: Type, label: 'Add Text (T)' },
    { id: 'image', icon: ImagePlus, label: 'Add Image (I)', action: onAddImage },
    { id: 'highlight', icon: Highlighter, label: 'Highlight (H)' },
    { id: 'draw', icon: Pen, label: 'Draw (D)' },
    { id: 'rectangle', icon: Square, label: 'Rectangle (R)' },
    { id: 'ellipse', icon: Circle, label: 'Ellipse (E)' },
    { id: 'line', icon: Minus, label: 'Line (L)' },
    { id: 'note', icon: StickyNote, label: 'Sticky Note (N)' },
    { id: 'eraser', icon: Eraser, label: 'Eraser (X)' },
  ];

  const handleTool = (tool) => {
    if (tool.action) {
      tool.action();
    }
    setActiveTool(tool.id);
  };

  return (
    <div
      className="fixed left-0 top-14 bottom-0 z-40 flex flex-col items-center py-4 px-2 gap-1 border-r"
      style={{
        width: '56px',
        background: 'rgba(13,13,13,0.97)',
        borderColor: 'rgba(245,240,232,0.08)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Tools */}
      {tools.map((tool, i) => (
        <React.Fragment key={tool.id}>
          {i === 2 && <Divider />}
          {i === 4 && <Divider />}
          {i === 9 && <Divider />}
          <ToolBtn
            icon={tool.icon}
            label={tool.label}
            active={activeTool === tool.id}
            onClick={() => handleTool(tool)}
          />
        </React.Fragment>
      ))}

      <div className="flex-1" />
      <Divider />

      {/* Undo / Redo */}
      <ToolBtn icon={Undo2} label="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo} />
      <ToolBtn icon={Redo2} label="Redo (Ctrl+Y)" onClick={onRedo} disabled={!canRedo} />

      <Divider />

      {/* Delete */}
      <ToolBtn icon={Trash2} label="Delete Selected" onClick={onDeleteSelected} color="#E84B2B" />

      <Divider />

      {/* Export */}
      <button
        onClick={onExport}
        data-tooltip="Export PDF"
        className="toolbar-btn w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ background: '#E84B2B', color: '#F5F0E8' }}
      >
        <Download size={16} strokeWidth={2} />
      </button>

      {/* Zoom info */}
      <div className="mt-2 text-center">
        <div className="font-mono text-center" style={{ color: '#8C8680', fontSize: '9px', lineHeight: 1.2 }}>
          {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
