import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, ArrowRight, Shield, Zap, Layers } from 'lucide-react';

const features = [
  { icon: FileText, label: 'Edit Text', desc: 'Click any text block to modify content inline' },
  { icon: Layers, label: 'Swap Images', desc: 'Replace or reposition images freely' },
  { icon: Zap, label: 'Instant Export', desc: 'Download your edited PDF in one click' },
  { icon: Shield, label: 'Private & Local', desc: 'Nothing leaves your browser' },
];

const DropZone = ({ onFileLoad }) => {
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');
    if (rejectedFiles.length > 0) {
      setError('Please upload a valid PDF file.');
      return;
    }
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are supported.');
        return;
      }
      onFileLoad(file);
    }
  }, [onFileLoad]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    noClick: false,
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-12" style={{ background: 'var(--ink)' }}>
      {/* Hero text */}
      <div className="text-center mb-12 animate-slide-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-6 border" style={{ borderColor: 'rgba(232,75,43,0.4)', background: 'rgba(232,75,43,0.08)', color: '#E84B2B' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot inline-block" />
          Free Online PDF Editor
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-extrabold leading-none tracking-tight mb-4" style={{ color: '#F5F0E8' }}>
          Edit Any PDF<br />
          <span style={{ color: '#E84B2B' }}>Instantly.</span>
        </h1>
        <p className="text-lg max-w-md mx-auto" style={{ color: '#8C8680', fontWeight: 300 }}>
          Upload your PDF and edit text, images, annotations — then export. No sign-up. No cloud. 100% in your browser.
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`relative w-full max-w-2xl rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${isDragActive ? 'drop-active' : ''}`}
        style={{
          borderColor: isDragActive ? '#E84B2B' : 'rgba(245,240,232,0.15)',
          background: isDragActive ? 'rgba(232,75,43,0.05)' : 'rgba(245,240,232,0.03)',
          minHeight: '260px',
        }}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300"
            style={{
              background: isDragActive ? '#E84B2B' : 'rgba(232,75,43,0.12)',
              transform: isDragActive ? 'scale(1.1) rotate(-3deg)' : 'scale(1)',
            }}
          >
            <Upload size={32} color={isDragActive ? '#F5F0E8' : '#E84B2B'} strokeWidth={1.5} />
          </div>
          <p className="font-display text-xl font-bold mb-2" style={{ color: '#F5F0E8' }}>
            {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF'}
          </p>
          <p className="text-sm mb-6" style={{ color: '#8C8680' }}>
            or{' '}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); open(); }}
              className="underline underline-offset-2 transition-colors"
              style={{ color: '#E84B2B' }}
            >
              browse to upload
            </button>
          </p>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono" style={{ background: 'rgba(245,240,232,0.06)', color: '#8C8680' }}>
            <FileText size={12} />
            <span>PDF files only · Max 50MB</span>
          </div>
        </div>

        {/* Corner decoration */}
        <div className="absolute top-3 right-3 font-mono text-xs" style={{ color: 'rgba(245,240,232,0.15)' }}>
          .PDF
        </div>
      </div>

      {error && (
        <div className="mt-4 px-4 py-2 rounded-lg text-sm font-mono" style={{ background: 'rgba(232,75,43,0.1)', color: '#E84B2B', border: '1px solid rgba(232,75,43,0.3)' }}>
          ⚠ {error}
        </div>
      )}

      {/* Features grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 w-full max-w-2xl animate-fade-in" style={{ animationDelay: '0.3s', opacity: 0 }}>
        {features.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="rounded-xl p-4 border transition-all duration-200 hover:border-white/20"
            style={{ background: 'rgba(245,240,232,0.03)', borderColor: 'rgba(245,240,232,0.08)' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(232,75,43,0.12)' }}>
              <Icon size={15} color="#E84B2B" />
            </div>
            <p className="font-display font-bold text-sm mb-1" style={{ color: '#F5F0E8' }}>{label}</p>
            <p className="text-xs leading-relaxed" style={{ color: '#8C8680' }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Bottom CTA arrow */}
      <div className="flex items-center gap-2 mt-10 text-sm" style={{ color: '#8C8680' }}>
        <span>Start by uploading a file above</span>
        <ArrowRight size={14} className="animate-bounce" style={{ animationDirection: 'alternate' }} />
      </div>
    </div>
  );
};

export default DropZone;
