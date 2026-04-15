'use client';
import React, { useState } from 'react';

export default function PhotoCapture({
  onCapture,
  onCancel,
  title = 'Proof of Delivery',
  helperText = 'Take a photo of the package at the destination',
  confirmLabel = 'Confirm Photo',
}) {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (preview) {
      onCapture(preview);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-theme-surface w-full max-w-lg rounded-[2.5rem] p-8 border border-theme-border shadow-2xl animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black tracking-tighter italic flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-500">photo_camera</span>
            {title}
          </h3>
          <button onClick={onCancel} className="w-10 h-10 rounded-full bg-theme-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="relative aspect-video bg-theme-surface-container rounded-3xl border-2 border-theme-border border-dashed overflow-hidden mb-8 flex items-center justify-center group">
          {preview ? (
            <img src={preview} alt="Proof" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-8">
              <span className="material-symbols-outlined text-4xl text-theme-text-muted mb-4 opacity-40">image</span>
              <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest leading-relaxed">
                {helperText}
              </p>
            </div>
          )}
          
          <input 
            type="file" 
            accept="image/*" 
            capture="camera" 
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
        </div>

        <div className="flex gap-4">
          <label className="flex-1 py-4 bg-theme-surface-container rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-theme-border transition-all cursor-pointer text-center">
            {preview ? 'Retake Photo' : 'Open Camera'}
            <input 
              type="file" 
              accept="image/*" 
              capture="camera" 
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <button 
            disabled={!preview}
            onClick={handleSave}
            className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg ${
              preview 
                ? 'bg-emerald-600 text-white hover:brightness-110 shadow-emerald-900/20' 
                : 'bg-theme-border text-theme-text-muted cursor-not-allowed'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <style jsx>{`
        .animate-scale-in {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
