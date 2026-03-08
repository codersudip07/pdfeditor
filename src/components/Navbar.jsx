import React from 'react';
import { FileText, Github, Globe, Zap } from 'lucide-react';

const Navbar = ({ hasPdf, onNewFile }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10" style={{ background: 'rgba(13,13,13,0.92)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#E84B2B' }}>
            <FileText size={16} color="#F5F0E8" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-display text-lg tracking-tight" style={{ color: '#F5F0E8', fontWeight: 800 }}>
              edit<span style={{ color: '#E84B2B' }}>with</span>sudip
            </span>
            <div className="font-mono" style={{ color: '#8C8680', fontSize: '10px', lineHeight: 1 }}>PDF EDITOR</div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border" style={{ borderColor: 'rgba(255,212,71,0.3)', background: 'rgba(255,212,71,0.05)', color: '#FFD447' }}>
          <Zap size={11} />
          <span>Edit · Annotate · Export</span>
        </div>

        <div className="flex items-center gap-3">
          {hasPdf && (
            <button onClick={onNewFile} className="px-4 py-1.5 rounded-lg text-sm font-medium border" style={{ borderColor: 'rgba(245,240,232,0.2)', color: '#8C8680' }}>
              New File
            </button>
          )}
          <a href="https://codersudip.in" target="_blank" rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg flex items-center justify-center border"
            style={{ borderColor: 'rgba(245,240,232,0.15)', color: '#8C8680' }}>
            <Globe size={15} />
          </a>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
