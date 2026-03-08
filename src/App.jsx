import React, { useState, useCallback, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import DropZone from './components/DropZone';
import Toolbar from './components/Toolbar';
import PDFCanvas from './components/PDFCanvas';
import PropertiesPanel from './components/PropertiesPanel';
import PageControls from './components/PageControls';
import ThumbnailPanel from './components/ThumbnailPanel';
import ExportModal from './components/ExportModal';

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 3;

export default function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [activeTool, setActiveTool] = useState('select');

  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [selectedId, setSelectedId] = useState(null);

  const [pdfTextItems, setPdfTextItems] = useState([]);
  const [selectedTextId, setSelectedTextId] = useState(null);

  const [showExport, setShowExport] = useState(false);
  const imageInputRef = useRef(null);

  const handleFileLoad = (file) => {
    setPdfFile(file);
    setElements([]); setHistory([[]]); setHistoryIdx(0);
    setCurrentPage(1); setSelectedId(null);
    setSelectedTextId(null); setPdfTextItems([]);
  };

  const handleNewFile = () => {
    setPdfFile(null); setElements([]); setHistory([[]]); setHistoryIdx(0);
    setCurrentPage(1); setSelectedId(null);
    setSelectedTextId(null); setPdfTextItems([]);
  };

  const pushHistory = useCallback((newElements) => {
    setHistory(prev => [...prev.slice(0, historyIdx + 1), newElements]);
    setHistoryIdx(prev => prev + 1);
    setElements(newElements);
  }, [historyIdx]);

  const setElementsWithHistory = useCallback((updater) => {
    const newElements = typeof updater === 'function' ? updater(elements) : updater;
    pushHistory(newElements);
  }, [elements, pushHistory]);

  const handleUndo = () => {
    if (historyIdx <= 0) return;
    const newIdx = historyIdx - 1;
    setHistoryIdx(newIdx); setElements(history[newIdx]); setSelectedId(null);
  };
  const handleRedo = () => {
    if (historyIdx >= history.length - 1) return;
    const newIdx = historyIdx + 1;
    setHistoryIdx(newIdx); setElements(history[newIdx]);
  };

  const handleZoomIn  = () => setZoom(z => Math.min(MAX_ZOOM, parseFloat((z + ZOOM_STEP).toFixed(2))));
  const handleZoomOut = () => setZoom(z => Math.max(MIN_ZOOM, parseFloat((z - ZOOM_STEP).toFixed(2))));

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    pushHistory(elements.filter(el => el.id !== selectedId));
    setSelectedId(null);
  };

  const handleAddImage = () => imageInputRef.current?.click();
  const handleImageFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const newEl = { id: Date.now().toString(), type: 'image', x: 80, y: 80, width: 200, height: 160, src: ev.target.result, opacity: 1, rotation: 0, page: currentPage };
      pushHistory([...elements, newEl]); setSelectedId(newEl.id);
    };
    reader.readAsDataURL(file); e.target.value = '';
  };

  const handleCommitUpdate = (id, updated) => {
    pushHistory(elements.map(el => el.id === id ? updated : el));
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') handleDeleteSelected();
      if (e.key === 'Escape') { setSelectedId(null); setSelectedTextId(null); setActiveTool('select'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); handleRedo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === '=') { e.preventDefault(); handleZoomIn(); }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); handleZoomOut(); }
      const toolMap = { v:'select', t:'text', h:'highlight', d:'draw', r:'rectangle', e:'ellipse', l:'line', n:'note', x:'eraser', i:'image' };
      if (!e.ctrlKey && !e.metaKey && toolMap[e.key]) setActiveTool(toolMap[e.key]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, historyIdx, history, elements]);

  const selectedElement = elements.find(el => el.id === selectedId);
  const editedCount = pdfTextItems.filter(it => it.editedText !== undefined && it.editedText !== it.originalText).length;

  const hintText = activeTool === 'select'
    ? '👆 Click any text on the PDF to edit it directly · Click shapes to select'
    : activeTool === 'text'      ? '➕ Click anywhere to add a new text box'
    : activeTool === 'note'      ? '📝 Click to place a sticky note'
    : activeTool === 'highlight' ? '🖊 Drag to highlight an area'
    : ['rectangle','ellipse','line'].includes(activeTool) ? '⬜ Drag to draw shape'
    : activeTool === 'image'     ? '🖼 Use the toolbar button to upload an image'
    : 'Press Escape to cancel · Delete to remove selected';

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D' }}>
      <Navbar hasPdf={!!pdfFile} onNewFile={handleNewFile} />

      {!pdfFile ? (
        <DropZone onFileLoad={handleFileLoad} />
      ) : (
        <>
          <Toolbar
            activeTool={activeTool} setActiveTool={setActiveTool}
            onUndo={handleUndo} onRedo={handleRedo}
            canUndo={historyIdx > 0} canRedo={historyIdx < history.length - 1}
            onExport={() => setShowExport(true)} onDeleteSelected={handleDeleteSelected}
            zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut}
            currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}
            onAddImage={handleAddImage}
          />

          <ThumbnailPanel pdfFile={pdfFile} currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

          {selectedElement && (
            <PropertiesPanel
              selectedElement={selectedElement}
              onUpdate={(id, updated) => handleCommitUpdate(id, updated)}
              onClose={() => setSelectedId(null)}
            />
          )}

          <main
            className="flex flex-col items-center justify-start min-h-screen overflow-auto"
            style={{ marginLeft: '156px', marginRight: selectedElement ? '240px' : '0', paddingBottom: '100px', paddingTop: '80px', transition: 'margin-right 0.25s ease' }}
            onClick={(e) => { if (e.target === e.currentTarget) { setSelectedId(null); setSelectedTextId(null); } }}
          >
            <PDFCanvas
              pdfFile={pdfFile} currentPage={currentPage} zoom={zoom} activeTool={activeTool}
              elements={elements} setElements={setElementsWithHistory}
              selectedId={selectedId} setSelectedId={setSelectedId}
              onPageCountChange={setTotalPages}
              pdfTextItems={pdfTextItems} setPdfTextItems={setPdfTextItems}
              selectedTextId={selectedTextId} setSelectedTextId={setSelectedTextId}
            />
          </main>

          <PageControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />

          {showExport && (
            <ExportModal
              onClose={() => setShowExport(false)} pdfFile={pdfFile}
              elements={elements} pdfTextItems={pdfTextItems} totalPages={totalPages}
            />
          )}

          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />

          <div className="fixed top-14 z-30 flex items-center px-4 py-1.5 gap-4"
            style={{ left: '156px', right: 0, background: 'rgba(13,13,13,0.92)', borderBottom: '1px solid rgba(245,240,232,0.06)', backdropFilter: 'blur(8px)' }}
          >
            <span className="font-mono text-xs" style={{ color: '#8C8680' }}>
              Tool: <span style={{ color: '#FFD447' }}>{activeTool.toUpperCase()}</span>
            </span>
            <span className="font-mono text-xs" style={{ color: '#8C8680' }}>{hintText}</span>
            {editedCount > 0 && (
              <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(26,86,255,0.15)', color: '#6b9fff' }}>
                ✏ {editedCount} text{editedCount > 1 ? 's' : ''} edited
              </span>
            )}
            <span className="ml-auto font-mono text-xs" style={{ color: '#3a3a3a' }}>{pdfFile?.name}</span>
          </div>
        </>
      )}
    </div>
  );
}
