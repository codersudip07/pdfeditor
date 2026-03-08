import React from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

const PageControls = ({ currentPage, totalPages, onPageChange, zoom, onZoomIn, onZoomOut }) => {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-4 py-2 rounded-2xl border"
      style={{
        background: 'rgba(26,26,26,0.96)',
        borderColor: 'rgba(245,240,232,0.12)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Zoom controls */}
      <button
        onClick={onZoomOut}
        disabled={zoom <= 0.4}
        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30"
        style={{ color: '#8C8680' }}
      >
        <ZoomOut size={14} />
      </button>
      <span className="font-mono text-xs px-2" style={{ color: '#F5F0E8', minWidth: '40px', textAlign: 'center' }}>
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={onZoomIn}
        disabled={zoom >= 3}
        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30"
        style={{ color: '#8C8680' }}
      >
        <ZoomIn size={14} />
      </button>

      {/* Divider */}
      <div className="w-px h-4 mx-2" style={{ background: 'rgba(245,240,232,0.15)' }} />

      {/* Page controls */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30"
        style={{ color: '#8C8680' }}
      >
        <ChevronLeft size={14} />
      </button>
      <div className="flex items-center gap-1 px-1">
        <span className="font-mono text-xs" style={{ color: '#F5F0E8' }}>{currentPage}</span>
        <span className="font-mono text-xs" style={{ color: '#8C8680' }}>/ {totalPages}</span>
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30"
        style={{ color: '#8C8680' }}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
};

export default PageControls;
