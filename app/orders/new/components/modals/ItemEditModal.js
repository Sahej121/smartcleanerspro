'use client';

import { useState } from 'react';
import PhotoCapture from '@/components/logistics/PhotoCapture';

export default function ItemEditModal({ 
  isOpen, 
  onClose, 
  onSave, 
  data, 
  t 
}) {
  const [editData, setEditData] = useState(data || { tag_id: '', bag_id: '', notes: '', fabric_hint: '', stain_analysis: null });
  const [showStainCapture, setShowStainCapture] = useState(false);
  const [stainAnalyzing, setStainAnalyzing] = useState(false);
  const [stainError, setStainError] = useState('');

  if (!isOpen) return null;

  const handleCapture = async (imageBase64) => {
    setShowStainCapture(false);
    setStainError('');
    setStainAnalyzing(true);
    try {
      const response = await fetch('/api/vision/stain-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 }),
      });
      const result = await response.json();
      if (response.ok) {
        setEditData({ ...editData, stain_analysis: result });
      } else {
        setStainError(result.error || 'Analysis failed');
      }
    } catch (e) {
      setStainError('Network error during analysis');
    }
    setStainAnalyzing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 backdrop-blur-md animate-fade-in">
      <div className="bg-theme-surface rounded-[2.5rem] p-8 max-sm:w-full max-w-sm w-full mx-4 shadow-2xl border border-theme-border animate-scale-in">
        <h3 className="text-xl font-black text-theme-text mb-6">Item Intake Details</h3>
        <div className="space-y-4 mb-8">
          <div>
            <label className="text-[10px] font-black uppercase text-theme-text-muted/70 tracking-widest block mb-1">Tag ID (Scanner)</label>
            <input 
              autoFocus
              type="text" 
              className="w-full bg-theme-surface-container border border-transparent rounded-xl p-3 text-sm font-bold focus:bg-theme-surface focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
              value={editData.tag_id}
              onChange={e => setEditData({...editData, tag_id: e.target.value})}
              placeholder="Scan or type tag..."
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-theme-text-muted/70 tracking-widest block mb-1">Bag Reference</label>
            <input 
              type="text" 
              className="w-full bg-theme-surface-container border border-transparent rounded-xl p-3 text-sm font-bold focus:bg-theme-surface focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
              value={editData.bag_id}
              onChange={e => setEditData({...editData, bag_id: e.target.value})}
              placeholder="e.g. B-01"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-theme-text-muted/70 tracking-widest block mb-1">Special Instructions</label>
            <textarea 
              className="w-full bg-theme-surface-container border border-transparent rounded-xl p-3 text-sm font-bold focus:bg-theme-surface focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all h-20"
              value={editData.notes}
              onChange={e => setEditData({...editData, notes: e.target.value})}
              placeholder="Stains, delicate fabric, etc."
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-theme-text-muted/70 tracking-widest block mb-1">Fabric Hint (Optional)</label>
            <input
              type="text"
              className="w-full bg-theme-surface-container border border-transparent rounded-xl p-3 text-sm font-bold focus:bg-theme-surface focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
              value={editData.fabric_hint}
              onChange={e => setEditData({ ...editData, fabric_hint: e.target.value })}
              placeholder="e.g. silk, wool, cotton"
            />
          </div>
          <div className="bg-theme-surface-container rounded-xl p-3 border border-theme-border">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-theme-text">ML Stain Scan</p>
                <p className="text-[10px] text-theme-text-muted">Automated defect detection</p>
              </div>
              <button
                type="button"
                onClick={() => setShowStainCapture(true)}
                disabled={stainAnalyzing}
                className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50"
              >
                {stainAnalyzing ? 'Analyzing...' : 'Scan Stain'}
              </button>
            </div>
            {stainError && (
              <p className="mt-2 text-[10px] font-bold text-red-600">{stainError}</p>
            )}
            {editData.stain_analysis?.stains?.[0] && (
              <div className="mt-3 p-2 rounded-lg bg-theme-surface border border-theme-border">
                <p className="text-[10px] font-black text-theme-text uppercase tracking-widest">
                  Detected: {editData.stain_analysis.stains[0].label}
                </p>
                <p className="text-[10px] text-theme-text-muted">
                  Confidence: {Math.round((editData.stain_analysis.stains[0].confidence || 0) * 100)}%
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => onSave(editData)}
            className="w-full py-4 primary-gradient text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/10 active:scale-95 transition-all"
          >
            Apply Tracking
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-theme-surface-container text-theme-text-muted rounded-2xl font-bold text-sm hover:bg-slate-200"
          >
            Cancel
          </button>
        </div>
      </div>

      {showStainCapture && (
        <PhotoCapture
          title="Stain Scanner"
          helperText="Take a clear photo of the stain area"
          confirmLabel="Analyze Stain"
          onCancel={() => setShowStainCapture(false)}
          onCapture={handleCapture}
        />
      )}
    </div>
  );
}
