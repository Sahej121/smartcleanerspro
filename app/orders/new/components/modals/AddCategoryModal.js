'use client';

import { useState } from 'react';

export default function AddCategoryModal({ isOpen, onClose, onAdd, loading, t }) {
  const [newCategory, setNewCategory] = useState({ garment_type: '', service_type: 'Dry Cleaning', price: '' });

  if (!isOpen) return null;

  const handleSubmit = () => {
    onAdd(newCategory);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 backdrop-blur-md animate-fade-in">
      <div className="bg-theme-surface rounded-[2.5rem] p-8 max-w-sm w-full mx-4 shadow-2xl border border-theme-border animate-scale-in">
        <h3 className="text-xl font-black text-theme-text mb-6">New Category</h3>
        <div className="space-y-4 mb-8">
          <div>
            <label className="text-[10px] font-black uppercase text-theme-text-muted/70 tracking-widest block mb-1">Garment Type</label>
            <input 
              autoFocus
              className="w-full bg-theme-surface-container border border-transparent rounded-xl p-3 text-sm font-bold focus:bg-theme-surface focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
              value={newCategory.garment_type}
              onChange={e => setNewCategory({...newCategory, garment_type: e.target.value})}
              placeholder="e.g. Silk Saree"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-theme-text-muted/70 tracking-widest block mb-1">Service</label>
            <select 
              className="w-full bg-theme-surface-container border border-transparent rounded-xl p-3 text-sm font-bold focus:bg-theme-surface focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
              value={newCategory.service_type}
              onChange={e => setNewCategory({...newCategory, service_type: e.target.value})}
            >
              <option>Dry Cleaning</option>
              <option>Laundry</option>
              <option>Steam Press</option>
              <option>Dyeing</option>
              <option>Polishing</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-theme-text-muted/70 tracking-widest block mb-1">Price (₹)</label>
            <input 
              type="number"
              className="w-full bg-theme-surface-container border border-transparent rounded-xl p-3 text-sm font-bold focus:bg-theme-surface focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
              value={newCategory.price}
              onChange={e => setNewCategory({...newCategory, price: e.target.value})}
              placeholder="0"
            />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <button 
            disabled={loading || !newCategory.garment_type || !newCategory.price}
            onClick={handleSubmit}
            className="w-full py-4 primary-gradient text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/10 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Category'}
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-theme-surface-container text-theme-text-muted rounded-2xl font-bold text-sm hover:bg-slate-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
