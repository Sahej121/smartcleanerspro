'use client';

import React from 'react';

export default function ServiceCatalog({
  garmentTypes,
  activeCategory,
  setActiveCategory,
  getCategoryIcon,
  getGarmentIcon,
  pricing,
  addToCart,
  setShowAddCategoryModal,
  handleAddCustomGarment,
  t
}) {
  return (
    <>
      {/* Column 1: Service Categories (Horizontal on mobile) */}
      <div className="lg:col-span-2 flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto no-scrollbar animate-fade-in-up stagger-1 pb-2 shrink-0">
        <h3 className="hidden lg:block text-xs font-black uppercase tracking-widest text-theme-text-muted/70 mb-2 px-1">{t('categories')}</h3>
        {garmentTypes.map((cat, i) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex shrink-0 lg:shrink flex-row lg:flex-col items-center justify-center p-3 lg:p-4 rounded-2xl transition-all duration-300 group gap-2 lg:gap-0 ${
              activeCategory === cat
                ? 'bg-theme-surface shadow-sm border border-theme-border ring-2 ring-emerald-500/10'
                : 'bg-theme-surface shadow-sm border border-theme-border hover:bg-theme-surface-container'
            }`}
          >
            <div className={`w-8 h-8 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center lg:mb-3 transition-all ${
              activeCategory === cat
                ? 'bg-theme-surface-container text-emerald-600'
                : 'bg-theme-surface-container text-theme-text-muted/70 group-hover:bg-theme-surface-container group-hover:text-emerald-600'
            }`}>
              <span className="material-symbols-outlined text-xl lg:text-3xl">{getCategoryIcon(cat)}</span>
            </div>
            <span className={`text-xs lg:text-sm whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'font-bold text-theme-text'
                : 'font-semibold text-theme-text-muted'
            }`}>{cat}</span>
          </button>
        ))}
      </div>

      {/* Column 2: Garment Grid */}
      <div className="lg:col-span-6 flex flex-col overflow-hidden min-h-[400px] lg:min-h-0">
        <div className="flex items-center justify-between mb-4 px-1 animate-fade-in-up stagger-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-theme-text-muted/70">{t('select_garments')}</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowAddCategoryModal(true)} className="px-3 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase hover:bg-amber-600 transition flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">add</span>{t('category_label')}</button>
            <button onClick={handleAddCustomGarment} className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase hover:bg-emerald-700 transition">{t('custom_item_btn')}</button>
            <button className="px-3 py-1 rounded-full bg-emerald-100 text-theme-text text-[10px] font-bold uppercase">{t('popular')}</button>
            <button className="px-3 py-1 rounded-full bg-theme-surface-container text-theme-text-muted text-[10px] font-bold uppercase">A-Z</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-4">
            {pricing
              .filter(p => activeCategory === 'All' || p.garment_type === activeCategory)
              .map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => addToCart(item)}
                  className="bg-theme-surface p-4 rounded-2xl border border-theme-border/50 shadow-sm hover:ring-2 hover:ring-emerald-500/20 transition-all cursor-pointer group relative overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Price Badge - Top Right */}
                  <div className="absolute top-0 right-0 p-2">
                    <span className="bg-theme-surface-container text-theme-text text-[10px] font-bold px-2 py-0.5 rounded-full">₹{item.price}</span>
                  </div>
                  {/* Icon Area */}
                  <div className="w-full aspect-square bg-theme-surface-container rounded-xl mb-3 flex items-center justify-center text-theme-text-muted/70 group-hover:bg-theme-surface-container group-hover:text-emerald-500 transition-colors">
                    <span className="material-symbols-outlined text-5xl">{getGarmentIcon(item.garment_type)}</span>
                  </div>
                  {/* Text */}
                  <h4 className="font-bold text-theme-text text-center text-sm">{item.garment_type}</h4>
                  <p className="text-[10px] text-theme-text-muted/70 text-center">{item.service_type}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}
