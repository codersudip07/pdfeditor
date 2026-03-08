import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const Thumbnail = ({ pdf, pageNum, isActive, onClick }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    const render = async () => {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.2 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (_) {}
    };
    render();
  }, [pdf, pageNum]);

  return (
    <button
      onClick={onClick}
      className="w-full flex flex-col items-center gap-1 p-2 rounded-lg transition-all"
      style={{
        background: isActive ? 'rgba(232,75,43,0.15)' : 'transparent',
        border: isActive ? '1px solid rgba(232,75,43,0.4)' : '1px solid transparent',
      }}
    >
      <canvas
        ref={canvasRef}
        className="rounded shadow"
        style={{ maxWidth: '100%', display: 'block', boxShadow: isActive ? '0 0 0 2px #E84B2B' : '0 2px 8px rgba(0,0,0,0.4)' }}
      />
      <span className="font-mono text-xs" style={{ color: isActive ? '#E84B2B' : '#8C8680' }}>{pageNum}</span>
    </button>
  );
};

const ThumbnailPanel = ({ pdfFile, currentPage, totalPages, onPageChange }) => {
  const [pdf, setPdf] = useState(null);

  useEffect(() => {
    if (!pdfFile) return;
    const load = async () => {
      const ab = await pdfFile.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: ab }).promise;
      setPdf(doc);
    };
    load();
  }, [pdfFile]);

  return (
    <div
      className="fixed left-14 top-14 bottom-0 z-30 overflow-y-auto py-4 px-2"
      style={{
        width: '100px',
        background: 'rgba(13,13,13,0.95)',
        borderRight: '1px solid rgba(245,240,232,0.08)',
      }}
    >
      <p className="font-mono text-center mb-3" style={{ color: '#8C8680', fontSize: '10px' }}>PAGES</p>
      <div className="flex flex-col gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
          <Thumbnail
            key={pageNum}
            pdf={pdf}
            pageNum={pageNum}
            isActive={currentPage === pageNum}
            onClick={() => onPageChange(pageNum)}
          />
        ))}
      </div>
    </div>
  );
};

export default ThumbnailPanel;
