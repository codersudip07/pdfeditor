import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import OverlayElement from './OverlayElement';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

// ── Single invisible hit-area over one PDF text item ─────────────────────────
const PdfTextItem = ({ item, zoom, isSelected, onClick, onChange, onWhiteOut }) => {
  const inputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [value, setValue] = useState(item.editedText ?? item.originalText);

  useEffect(() => {
    if (!editing) setValue(item.editedText ?? item.originalText);
  }, [item.editedText, item.originalText]);

  const startEdit = (e) => {
    e.stopPropagation();
    onClick(item.id);
    setEditing(true);
    onWhiteOut(item, true, null);
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 10);
  };

  const commitEdit = () => {
    setEditing(false);
    onChange(item.id, value);
    onWhiteOut(item, false, value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); commitEdit(); }
    e.stopPropagation();
  };

  const isEdited = item.editedText !== undefined && item.editedText !== item.originalText;
  const left   = item.screenX * zoom;
  const top    = item.screenY * zoom;
  const width  = Math.max(item.screenW * zoom, 10);
  const height = Math.max(item.screenH * zoom, 8);
  const fz     = Math.max(item.screenH * zoom * 0.82, 7);

  return (
    <div
      style={{
        position: 'absolute', left, top, width, height,
        cursor: 'text', zIndex: editing ? 80 : 15,
        background: editing ? 'transparent'
          : isEdited   ? 'rgba(26,86,255,0.06)'
          : isSelected ? 'rgba(232,75,43,0.06)'
          : hovered    ? 'rgba(255,212,71,0.06)'
          : 'transparent',
        outline: editing ? 'none'
          : isEdited   ? '1.5px solid rgba(26,86,255,0.4)'
          : isSelected ? '1.5px solid rgba(232,75,43,0.5)'
          : hovered    ? '1px dashed rgba(255,212,71,0.45)'
          : 'none',
        borderRadius: 2, boxSizing: 'border-box',
      }}
      onClick={startEdit}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={isEdited ? `✏ "${value}"` : 'Click to edit'}
    >
      {editing && (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', left: 0, top: 0,
            minWidth: width + 40,
            width: Math.max(value.length * fz * 0.62 + 24, width + 40),
            height: height + 2,
            fontSize: fz,
            fontFamily: item.fontFamily || 'serif',
            fontWeight: item.fontBold ? 'bold' : 'normal',
            color: '#000', background: '#fff',
            border: '2px solid #FFD447', outline: 'none',
            padding: '0 3px', lineHeight: 1,
            boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
            borderRadius: 3, zIndex: 100,
          }}
        />
      )}
    </div>
  );
};

// ── Main canvas component ─────────────────────────────────────────────────────
const PDFCanvas = ({
  pdfFile, currentPage, zoom, activeTool,
  elements, setElements, selectedId, setSelectedId,
  onPageCountChange,
  pdfTextItems, setPdfTextItems,
  selectedTextId, setSelectedTextId,
}) => {
  const canvasRef      = useRef(null);
  const pdfRef         = useRef(null);
  const renderTaskRef  = useRef(null);   // track in-flight render task
  const [canvasSize, setCanvasSize] = useState({ width: 620, height: 877 });
  const [isRendering, setIsRendering] = useState(false);
  const [drawing, setDrawing]     = useState(false);
  const [drawStart, setDrawStart] = useState(null);

  // ── 1. Load PDF + extract text at scale=1 ───────────────────────────────
  useEffect(() => {
    if (!pdfFile) return;
    let cancelled = false;
    const load = async () => {
      setIsRendering(true);
      try {
        const ab  = await pdfFile.arrayBuffer();
        if (cancelled) return;
        const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        onPageCountChange(pdf.numPages);

        const allItems = [];
        for (let p = 1; p <= pdf.numPages; p++) {
          if (cancelled) break;
          const page = await pdf.getPage(p);
          const vp   = page.getViewport({ scale: 1 });
          const tc   = await page.getTextContent();

          tc.items.forEach((item, idx) => {
            const str = item.str;
            if (!str || !str.trim()) return;
            const [a, b, c, d, e, f] = item.transform;
            const scaleY   = Math.sqrt(c * c + d * d);
            const scaleX   = Math.sqrt(a * a + b * b);
            const fontSize = scaleY || scaleX || 12;
            // Convert PDF bottom-left → canvas top-left at scale=1
            const screenX = e * vp.scale;
            const screenY = vp.height - (f * vp.scale);
            const screenW = (item.width || fontSize * str.length * 0.6) * vp.scale;
            const screenH = fontSize * vp.scale;

            allItems.push({
              id: `t-${p}-${idx}`,
              page: p,
              originalText: str,
              editedText: undefined,
              screenX,
              screenY: screenY - screenH,
              screenW: Math.max(screenW, 4),
              screenH: Math.max(screenH, 6),
              fontSize,
              fontFamily: (item.fontName || 'serif').replace(/^[A-Z]+\+/, ''),
              fontBold: /Bold/i.test(item.fontName || ''),
            });
          });
        }
        if (!cancelled) setPdfTextItems(allItems);
      } catch (err) {
        if (!cancelled) console.error('PDF load error:', err);
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [pdfFile]);

  // ── 2. Render page — cancel previous task before starting new one ────────
  const renderPage = useCallback(async (textItemsForPage) => {
    if (!pdfRef.current || !canvasRef.current) return;

    // Cancel any in-flight render
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch (_) {}
      renderTaskRef.current = null;
    }

    setIsRendering(true);
    try {
      const page = await pdfRef.current.getPage(currentPage);
      const vp   = page.getViewport({ scale: zoom });

      const canvas = canvasRef.current;
      const ctx    = canvas.getContext('2d');
      canvas.width  = vp.width;
      canvas.height = vp.height;
      setCanvasSize({ width: vp.width, height: vp.height });

      const task = page.render({ canvasContext: ctx, viewport: vp });
      renderTaskRef.current = task;
      await task.promise;
      renderTaskRef.current = null;

      // Re-apply white-outs + replacement text for edits on this page
      if (textItemsForPage) {
        const edited = textItemsForPage.filter(
          it => it.page === currentPage && it.editedText !== undefined
        );
        edited.forEach(it => {
          whiteOutOnCtx(ctx, it, zoom);
          if (it.editedText.trim()) drawTextOnCtx(ctx, it, zoom, it.editedText);
        });
      }
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Render error:', err);
      }
    } finally {
      setIsRendering(false);
    }
  }, [currentPage, zoom]);

  // Re-render whenever page or zoom changes
  useEffect(() => {
    renderPage(pdfTextItems);
  }, [pdfRef.current, currentPage, zoom]);

  // Re-apply edits whenever pdfTextItems changes (after a commit)
  useEffect(() => {
    if (!pdfRef.current) return;
    renderPage(pdfTextItems);
  }, [pdfTextItems]);

  // ── Canvas drawing helpers ──────────────────────────────────────────────
  const whiteOutOnCtx = (ctx, item, z) => {
    const pad = 1;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      item.screenX * z - pad,
      item.screenY * z - pad,
      item.screenW * z + pad * 2 + 6,
      item.screenH * z + pad * 2 + 2
    );
    ctx.restore();
  };

  const drawTextOnCtx = (ctx, item, z, text) => {
    const fz = Math.max(item.screenH * z * 0.82, 7);
    ctx.save();
    ctx.font = `${item.fontBold ? 'bold ' : ''}${fz}px ${item.fontFamily || 'serif'}`;
    ctx.fillStyle = '#000';
    ctx.textBaseline = 'top';
    ctx.fillText(text, item.screenX * z, item.screenY * z);
    ctx.restore();
  };

  // Called by PdfTextItem on edit start / commit
  const handleWhiteOut = useCallback((item, isStarting, committedText) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (isStarting) {
      whiteOutOnCtx(ctx, item, zoom);
    } else {
      whiteOutOnCtx(ctx, item, zoom);
      if (committedText && committedText.trim()) drawTextOnCtx(ctx, item, zoom, committedText);
    }
  }, [zoom]);

  const handleTextChange = (id, newText) => {
    setPdfTextItems(prev => prev.map(it => it.id === id ? { ...it, editedText: newText } : it));
  };

  // ── Drawing tools ──────────────────────────────────────────────────────
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
  };

  const handleMouseDown = (e) => {
    setSelectedId(null); setSelectedTextId(null);
    if (['text','note','image','eraser','select'].includes(activeTool)) return;
    setDrawing(true); setDrawStart(getPos(e));
  };

  const handleMouseUp = (e) => {
    if (!drawing || !drawStart) return;
    const pos = getPos(e);
    const newEl = {
      id: Date.now().toString(), type: activeTool,
      x: Math.min(drawStart.x, pos.x), y: Math.min(drawStart.y, pos.y),
      width: Math.abs(pos.x - drawStart.x) || 60,
      height: Math.abs(pos.y - drawStart.y) || 30,
      color: activeTool === 'highlight' ? '#FFD447' : '#E84B2B',
      fill: 'transparent',
      opacity: activeTool === 'highlight' ? 0.4 : 1,
      strokeWidth: 2, page: currentPage,
    };
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
    setDrawing(false); setDrawStart(null);
  };

  const handleClick = (e) => {
    if (!['text','note'].includes(activeTool)) return;
    const pos = getPos(e);
    if (activeTool === 'text') {
      const el = { id: Date.now().toString(), type: 'text', x: pos.x, y: pos.y, width: 220, height: 36, content: 'New text', fontSize: 16, fontFamily: 'DM Sans', color: '#0D0D0D', bold: false, italic: false, underline: false, textAlign: 'left', opacity: 1, rotation: 0, page: currentPage };
      setElements(prev => [...prev, el]); setSelectedId(el.id);
    }
    if (activeTool === 'note') {
      const el = { id: Date.now().toString(), type: 'note', x: pos.x, y: pos.y, width: 180, height: 120, content: 'Sticky note', fontSize: 13, opacity: 1, rotation: 0, page: currentPage };
      setElements(prev => [...prev, el]); setSelectedId(el.id);
    }
  };

  const pageTextItems = pdfTextItems.filter(it => it.page === currentPage);
  const pageElements  = elements.filter(el => el.page === currentPage);
  const cursor = activeTool === 'select' ? 'default' : ['text','note'].includes(activeTool) ? 'text' : 'crosshair';

  return (
    <div className="relative inline-block" style={{ cursor }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        style={{ display: isRendering ? 'none' : 'block' }}
      />

      {isRendering && (
        <div style={{ width: canvasSize.width, height: canvasSize.height, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E84B2B', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontFamily: 'monospace', color: '#8C8680', fontSize: 13 }}>Loading…</span>
          </div>
        </div>
      )}

      {!isRendering && pageTextItems.map(item => (
        <PdfTextItem
          key={item.id} item={item} zoom={zoom}
          isSelected={selectedTextId === item.id}
          onClick={id => { setSelectedTextId(id); setSelectedId(null); }}
          onChange={handleTextChange}
          onWhiteOut={handleWhiteOut}
        />
      ))}

      <div className="absolute inset-0 pointer-events-none" style={{ width: canvasSize.width, height: canvasSize.height }}>
        {pageElements.map(el => (
          <div key={el.id} className="pointer-events-auto">
            <OverlayElement
              element={el}
              isSelected={selectedId === el.id}
              onSelect={id => { setSelectedId(id); setSelectedTextId(null); }}
              onUpdate={(id, updated) => setElements(prev => prev.map(e => e.id === id ? updated : e))}
              onDelete={id => { setElements(prev => prev.filter(e => e.id !== id)); setSelectedId(null); }}
              zoom={zoom}
            />
          </div>
        ))}
      </div>

      {drawing && drawStart && (
        <div style={{ position: 'absolute', border: '2px dashed #E84B2B', pointerEvents: 'none', left: drawStart.x * zoom, top: drawStart.y * zoom, width: 2, height: 2 }} />
      )}
    </div>
  );
};

export default PDFCanvas;
