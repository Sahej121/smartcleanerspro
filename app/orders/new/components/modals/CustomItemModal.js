'use client';

import { useState } from 'react';

export default function CustomItemModal({ isOpen, onClose, onAdd, t }) {
  const [customItem, setCustomItem] = useState({ name: '', price: '' });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-on-surface/20 backdrop-blur-sm p-4">
      <div className="bg-theme-surface rounded-[2.5rem] shadow-2xl border border-theme-border/50 p-8 w-full max-w-md animate-scale-in">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-theme-surface-container text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">add_shopping_cart</span>
          </div>
          <div>
            <h2 className="text-xl font-black font-headline text-theme-text">Custom Garment</h2>
            <p className="text-xs font-medium text-theme-text-muted uppercase tracking-widest">Manual Item Entry</p>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          <div>
            <label className="text-[10px] font-black uppercase text-theme-text-muted/70 tracking-widest pl-2 mb-2 block">Item Description</label>
            <input 
              autoFocus
              className="w-full bg-theme-surface-container border-none rounded-2xl py-4 px-6 text-sm font-bold shadow-inner focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-theme-text-muted/70"
              placeholder="e.g. Designer Silk Jacket"
              value={customItem.name} 
              onChange={e => setCustomItem({ ...customItem, name: e.target.value })} 
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-theme-text-muted/70 tracking-widest pl-2 mb-2 block">Service Price (₹)</label>
            <input 
              type="number"
              className="w-full bg-theme-surface-container border-none rounded-2xl py-4 px-6 text-sm font-bold shadow-inner focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-theme-text-muted/70 font-headline text-xl"
              placeholder="0.00"
              value={customItem.price} 
              onChange={e => setCustomItem({ ...customItem, price: e.target.value })} 
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            disabled={!customItem.name || !customItem.price}
            onClick={() => {
              onAdd({ 
                garment_type: customItem.name, 
                service_type: 'Custom Service', 
                price: parseFloat(customItem.price) || 0 
              });
              onClose();
              setCustomItem({ name: '', price: '' });
            }}
            className="w-full py-4 primary-gradient text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/10 active:scale-95 transition-all disabled:opacity-50"
          >
            Add to Cart
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-theme-surface-container text-theme-text-muted/70 rounded-2xl font-bold text-sm hover:bg-theme-surface-container transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
