import React, { useState } from 'react';
import { X, Download, Loader2, CheckCircle } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';

const hexToRgb = (hex) => {
  if (!hex || !hex.startsWith('#')) return rgb(0,0,0);
  return rgb(parseInt(hex.slice(1,3),16)/255, parseInt(hex.slice(3,5),16)/255, parseInt(hex.slice(5,7),16)/255);
};

const ExportModal = ({ onClose, pdfFile, elements, pdfTextItems = [], totalPages }) => {
  const [exporting, setExporting] = useState(false);
  const [done, setDone]           = useState(false);
  const [progress, setProgress]   = useState(0);
  const [filename, setFilename]   = useState('edited-document');

  const handleExport = async () => {
    if (!pdfFile) return;
    setExporting(true); setProgress(10);
    try {
      // FIX: was `arrayBuffer = ab` (typo creating global) — now correct
      const ab     = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(ab);
      const pages  = pdfDoc.getPages();
      setProgress(25);

      const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      for (let pi = 0; pi < pages.length; pi++) {
        const page    = pages[pi];
        const { width: pw, height: ph } = page.getSize();
        const pageNum = pi + 1;

        // A. Replace edited PDF text items
        const editedItems = pdfTextItems.filter(it =>
          it.page === pageNum && it.editedText !== undefined
        );
        for (const item of editedItems) {
          // item coords are in scale=1 viewport px. For a standard PDF the
          // viewport height at scale=1 equals the PDF page height in pts.
          const pdfX = item.screenX;
          const pdfY = ph - item.screenY - item.screenH;

          // White-out rectangle over original text
          page.drawRectangle({
            x: pdfX - 1, y: pdfY - 1,
            width: item.screenW + 8, height: item.screenH + 3,
            color: rgb(1,1,1), opacity: 1,
          });

          // Draw replacement text
          if (item.editedText && item.editedText.trim()) {
            const fz = Math.max(item.fontSize * 0.82, 6);
            page.drawText(item.editedText, {
              x: pdfX, y: pdfY,
              size: fz,
              font: item.fontBold ? fontBold : font,
              color: rgb(0,0,0),
              maxWidth: pw - pdfX,
            });
          }
        }

        // B. Draw added overlay elements
        const pageEls = elements.filter(el => el.page === pageNum);
        for (const el of pageEls) {
          try {
            const ex = el.x;
            const ey = ph - el.y - el.height;

            if (el.type === 'text' && el.content) {
              const fz = el.fontSize || 16;
              page.drawText(el.content, {
                x: ex, y: ey + el.height - fz, size: fz,
                font: el.bold ? fontBold : font,
                color: el.color?.startsWith('#') ? hexToRgb(el.color) : rgb(0,0,0),
                opacity: el.opacity ?? 1, maxWidth: el.width,
              });
            }
            if (el.type === 'rectangle') {
              page.drawRectangle({
                x: ex, y: ey, width: el.width, height: el.height,
                borderColor: hexToRgb(el.color || '#E84B2B'), borderWidth: el.strokeWidth || 2,
                color: (el.fill && el.fill !== 'transparent') ? hexToRgb(el.fill) : undefined,
                opacity: el.opacity ?? 1,
              });
            }
            if (el.type === 'ellipse') {
              page.drawEllipse({
                x: ex + el.width/2, y: ey + el.height/2,
                xScale: el.width/2, yScale: el.height/2,
                borderColor: hexToRgb(el.color || '#E84B2B'), borderWidth: el.strokeWidth || 2,
                opacity: el.opacity ?? 1,
              });
            }
            if (el.type === 'highlight') {
              page.drawRectangle({ x: ex, y: ey, width: el.width, height: el.height, color: rgb(1,0.83,0.28), opacity: 0.4 });
            }
            if (el.type === 'note') {
              page.drawRectangle({ x: ex, y: ey, width: el.width, height: el.height, color: rgb(1,0.83,0.28), opacity: 0.92 });
              if (el.content) {
                page.drawText(el.content.substring(0,120), {
                  x: ex+6, y: ey + el.height - (el.fontSize||13) - 4,
                  size: el.fontSize||13, font, color: rgb(0,0,0), maxWidth: el.width-12,
                });
              }
            }
            if (el.type === 'image' && el.src) {
              try {
                const res = await fetch(el.src);
                const imgBytes = await res.arrayBuffer();
                const emb = el.src.startsWith('data:image/png') ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
                page.drawImage(emb, { x: ex, y: ey, width: el.width, height: el.height, opacity: el.opacity??1 });
              } catch(_) {}
            }
          } catch(elErr) { console.warn(elErr); }
        }

        setProgress(25 + Math.round(((pi+1)/pages.length)*65));
      }

      setProgress(93);
      const bytes = await pdfDoc.save();
      saveAs(new Blob([bytes], { type: 'application/pdf' }), `${filename||'edited-document'}.pdf`);
      setProgress(100); setDone(true);
    } catch(err) {
      console.error('Export error:', err);
      alert('Export failed: ' + err.message);
      setExporting(false);
    }
  };

  const editedCount = pdfTextItems.filter(it => it.editedText !== undefined && it.editedText !== it.originalText).length;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="relative w-full max-w-md mx-4 rounded-2xl border overflow-hidden" style={{ background: '#111', borderColor: 'rgba(245,240,232,0.12)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(245,240,232,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#E84B2B' }}>
              <Download size={15} color="#F5F0E8" />
            </div>
            <span className="font-display font-bold" style={{ color: '#F5F0E8' }}>Export PDF</span>
          </div>
          {!exporting && (
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10" style={{ color: '#8C8680' }}>
              <X size={15} />
            </button>
          )}
        </div>
        <div className="p-6 space-y-5">
          {!done ? (
            <>
              <div>
                <label className="text-xs font-mono mb-2 block" style={{ color: '#8C8680' }}>FILE NAME</label>
                <div className="flex">
                  <input type="text" value={filename} onChange={e => setFilename(e.target.value)} disabled={exporting}
                    className="flex-1 px-3 py-2 rounded-l-lg text-sm font-mono"
                    style={{ background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.12)', borderRight: 'none', color: '#F5F0E8', outline: 'none' }}
                  />
                  <span className="px-3 py-2 rounded-r-lg text-sm font-mono" style={{ background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.12)', color: '#8C8680' }}>.pdf</span>
                </div>
              </div>
              <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.08)' }}>
                {[['Pages', totalPages],['PDF text edits', editedCount],['Added elements', elements.length]].map(([k,v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-xs font-mono" style={{ color: '#8C8680' }}>{k}</span>
                    <span className="text-xs font-mono" style={{ color: (v > 0 && k !== 'Pages') ? '#6b9fff' : '#F5F0E8' }}>{v}</span>
                  </div>
                ))}
              </div>
              {exporting && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-mono" style={{ color: '#8C8680' }}>Embedding changes…</span>
                    <span className="text-xs font-mono" style={{ color: '#E84B2B' }}>{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(245,240,232,0.1)' }}>
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: '#E84B2B' }} />
                  </div>
                </div>
              )}
              <button onClick={handleExport} disabled={exporting}
                className="w-full py-3 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: exporting ? 'rgba(232,75,43,0.4)' : '#E84B2B', color: '#F5F0E8', cursor: exporting ? 'not-allowed' : 'pointer' }}
              >
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {exporting ? 'Exporting…' : 'Download PDF'}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center py-6 text-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                <CheckCircle size={32} color="#10B981" />
              </div>
              <div>
                <p className="font-display font-bold text-lg mb-1" style={{ color: '#F5F0E8' }}>Export Complete!</p>
                <p className="text-sm" style={{ color: '#8C8680' }}>Your edited PDF has been saved.</p>
              </div>
              <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-display font-bold text-sm" style={{ background: '#E84B2B', color: '#F5F0E8' }}>Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
