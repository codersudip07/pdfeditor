import React from 'react';
import { X, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline } from 'lucide-react';

const colors = ['#0D0D0D', '#E84B2B', '#FFD447', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F5F0E8'];
const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];
const fontFamilies = ['DM Sans', 'Syne', 'JetBrains Mono', 'Georgia', 'Arial', 'Times New Roman', 'Courier New'];

const PropertiesPanel = ({ selectedElement, onUpdate, onClose }) => {
  if (!selectedElement) return null;

  const update = (key, value) => onUpdate(selectedElement.id, { ...selectedElement, [key]: value });

  const isText = selectedElement.type === 'text' || selectedElement.type === 'note';
  const isShape = ['rectangle', 'ellipse', 'line'].includes(selectedElement.type);

  return (
    <div
      className="fixed right-0 top-14 bottom-0 z-40 overflow-y-auto"
      style={{
        width: '240px',
        background: 'rgba(13,13,13,0.97)',
        borderLeft: '1px solid rgba(245,240,232,0.08)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(245,240,232,0.08)' }}>
        <span className="font-display font-bold text-sm" style={{ color: '#F5F0E8' }}>Properties</span>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors" style={{ color: '#8C8680' }}>
          <X size={14} />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Element type */}
        <div className="px-2 py-1 rounded font-mono text-xs" style={{ background: 'rgba(232,75,43,0.1)', color: '#E84B2B', display: 'inline-block' }}>
          {selectedElement.type}
        </div>

        {/* Position & Size */}
        <div>
          <p className="text-xs font-mono mb-2" style={{ color: '#8C8680' }}>POSITION & SIZE</p>
          <div className="grid grid-cols-2 gap-2">
            {['x', 'y', 'width', 'height'].map(prop => (
              <div key={prop}>
                <label className="text-xs" style={{ color: '#8C8680' }}>{prop.toUpperCase()}</label>
                <input
                  type="number"
                  value={Math.round(selectedElement[prop] || 0)}
                  onChange={e => update(prop, Number(e.target.value))}
                  className="w-full mt-0.5 px-2 py-1 rounded text-xs font-mono"
                  style={{ background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.12)', color: '#F5F0E8', outline: 'none' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Text properties */}
        {isText && (
          <>
            <div>
              <p className="text-xs font-mono mb-2" style={{ color: '#8C8680' }}>FONT</p>
              <select
                value={selectedElement.fontFamily || 'DM Sans'}
                onChange={e => update('fontFamily', e.target.value)}
                className="w-full px-2 py-1.5 rounded text-xs mb-2"
                style={{ background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.12)', color: '#F5F0E8', outline: 'none' }}
              >
                {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
              </select>

              <div className="flex gap-2 items-center">
                <select
                  value={selectedElement.fontSize || 16}
                  onChange={e => update('fontSize', Number(e.target.value))}
                  className="flex-1 px-2 py-1.5 rounded text-xs"
                  style={{ background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.12)', color: '#F5F0E8', outline: 'none' }}
                >
                  {fontSizes.map(s => <option key={s} value={s}>{s}px</option>)}
                </select>

                {/* Bold, Italic, Underline */}
                {[
                  { prop: 'bold', Icon: Bold, label: 'B' },
                  { prop: 'italic', Icon: Italic, label: 'I' },
                  { prop: 'underline', Icon: Underline, label: 'U' },
                ].map(({ prop, Icon }) => (
                  <button
                    key={prop}
                    onClick={() => update(prop, !selectedElement[prop])}
                    className="w-7 h-7 rounded flex items-center justify-center text-xs"
                    style={{
                      background: selectedElement[prop] ? 'rgba(232,75,43,0.2)' : 'rgba(245,240,232,0.06)',
                      color: selectedElement[prop] ? '#E84B2B' : '#8C8680',
                      border: '1px solid rgba(245,240,232,0.12)',
                    }}
                  >
                    <Icon size={11} />
                  </button>
                ))}
              </div>
            </div>

            {/* Alignment */}
            <div>
              <p className="text-xs font-mono mb-2" style={{ color: '#8C8680' }}>ALIGNMENT</p>
              <div className="flex gap-1">
                {[
                  { val: 'left', Icon: AlignLeft },
                  { val: 'center', Icon: AlignCenter },
                  { val: 'right', Icon: AlignRight },
                ].map(({ val, Icon }) => (
                  <button
                    key={val}
                    onClick={() => update('textAlign', val)}
                    className="flex-1 h-7 rounded flex items-center justify-center"
                    style={{
                      background: (selectedElement.textAlign || 'left') === val ? 'rgba(232,75,43,0.2)' : 'rgba(245,240,232,0.06)',
                      color: (selectedElement.textAlign || 'left') === val ? '#E84B2B' : '#8C8680',
                      border: '1px solid rgba(245,240,232,0.12)',
                    }}
                  >
                    <Icon size={12} />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Color picker */}
        {(isText || isShape) && (
          <div>
            <p className="text-xs font-mono mb-2" style={{ color: '#8C8680' }}>{isText ? 'TEXT COLOR' : 'COLOR'}</p>
            <div className="flex flex-wrap gap-2">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => update('color', c)}
                  className="w-6 h-6 rounded-md transition-transform hover:scale-110"
                  style={{
                    background: c,
                    border: selectedElement.color === c ? '2px solid #FFD447' : '2px solid transparent',
                    boxShadow: c === '#F5F0E8' ? 'inset 0 0 0 1px rgba(0,0,0,0.2)' : 'none',
                  }}
                />
              ))}
            </div>
            {/* Custom color */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="color"
                value={selectedElement.color || '#0D0D0D'}
                onChange={e => update('color', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer"
                style={{ background: 'transparent', border: 'none', padding: 0 }}
              />
              <span className="font-mono text-xs" style={{ color: '#8C8680' }}>{selectedElement.color || '#0D0D0D'}</span>
            </div>
          </div>
        )}

        {/* Background color for shapes */}
        {isShape && (
          <div>
            <p className="text-xs font-mono mb-2" style={{ color: '#8C8680' }}>FILL COLOR</p>
            <div className="flex flex-wrap gap-2">
              {['transparent', ...colors].map(c => (
                <button
                  key={c}
                  onClick={() => update('fill', c)}
                  className="w-6 h-6 rounded-md transition-transform hover:scale-110"
                  style={{
                    background: c === 'transparent' ? 'transparent' : c,
                    border: (selectedElement.fill || 'transparent') === c ? '2px solid #FFD447' : '1px solid rgba(245,240,232,0.2)',
                    backgroundImage: c === 'transparent' ? 'linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%), linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%)' : 'none',
                    backgroundSize: c === 'transparent' ? '8px 8px' : 'auto',
                    backgroundPosition: c === 'transparent' ? '0 0, 4px 4px' : 'auto',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Opacity */}
        <div>
          <p className="text-xs font-mono mb-2" style={{ color: '#8C8680' }}>OPACITY — {Math.round((selectedElement.opacity ?? 1) * 100)}%</p>
          <input
            type="range" min={0} max={1} step={0.05}
            value={selectedElement.opacity ?? 1}
            onChange={e => update('opacity', Number(e.target.value))}
            className="w-full"
            style={{ accentColor: '#E84B2B' }}
          />
        </div>

        {/* Rotation */}
        <div>
          <p className="text-xs font-mono mb-2" style={{ color: '#8C8680' }}>ROTATION — {Math.round(selectedElement.rotation || 0)}°</p>
          <input
            type="range" min={-180} max={180} step={1}
            value={selectedElement.rotation || 0}
            onChange={e => update('rotation', Number(e.target.value))}
            className="w-full"
            style={{ accentColor: '#E84B2B' }}
          />
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
