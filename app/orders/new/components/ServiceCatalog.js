'use client';

import React, { useState, useMemo } from 'react';

const ServiceCatalog = React.memo(function ServiceCatalog({
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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPricing = useMemo(() => {
    return pricing.filter(p => {
      const matchesCategory = activeCategory === 'All' || p.garment_type === activeCategory;
      const matchesSearch = p.garment_type.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.service_type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [pricing, activeCategory, searchQuery]);

  return (
    <>
      {/* Column 1: Service Categories (Horizontal on mobile) */}
      <div className="lg:col-span-2 flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto no-scrollbar animate-fade-in-up stagger-1 pb-4 shrink-0">
        <h3 className="hidden lg:block text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted/50 mb-3 px-2">Categories</h3>
        {garmentTypes.map((cat, i) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex shrink-0 flex-row lg:flex-col items-center justify-center p-3 lg:p-4 rounded-[1.75rem] transition-all duration-500 group gap-2 lg:gap-3 relative overflow-hidden ${
              activeCategory === cat
                ? 'bg-theme-surface shadow-lg shadow-emerald-900/10 border border-emerald-500/20 ring-1 ring-emerald-500/10'
                : 'bg-theme-surface border border-theme-border/60 hover:border-emerald-500/20 hover:shadow-md'
            }`}
          >
            {activeCategory === cat && (
              <div className="absolute inset-0 bg-emerald-500/5 animate-pulse"></div>
            )}
            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center transition-all duration-500 relative z-10 shrink-0 ${
              activeCategory === cat
                ? 'bg-emerald-600 text-white scale-110'
                : 'bg-theme-surface-container text-theme-text-muted/60 group-hover:bg-emerald-50 group-hover:text-emerald-600'
            }`}>
              <span className="material-symbols-outlined text-2xl">{getCategoryIcon(cat)}</span>
            </div>
            <span className={`text-[10px] lg:text-xs whitespace-nowrap transition-colors relative z-10 uppercase tracking-widest ${
              activeCategory === cat
                ? 'font-black text-theme-text'
                : 'font-bold text-theme-text-muted group-hover:text-theme-text'
            }`}>{cat}</span>
          </button>
        ))}
      </div>

      {/* Column 2: Garment Grid */}
      <div className="lg:col-span-6 flex flex-col overflow-hidden min-h-[400px] lg:min-h-0">
        <div className="flex items-center justify-between mb-5 px-1 animate-fade-in-up stagger-2">
          <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted/50 hidden sm:block">Select Items</h3>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted/50 text-[18px]">search</span>
              <input 
                type="text" 
                placeholder="Search catalog..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-theme-surface border border-theme-border/60 text-xs text-theme-text placeholder:text-theme-text-muted/50 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all w-[140px] sm:w-[200px]"
              />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar shrink-0">
            <button 
              onClick={() => setShowAddCategoryModal(true)} 
              className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider hover:bg-amber-600 transition-all flex items-center gap-1.5 shadow-md shadow-amber-900/10 active:scale-95"
            >
              <span className="material-symbols-outlined text-[14px]">add_circle</span>
              <span className="hidden sm:inline">Category</span>
            </button>
            <button 
              onClick={handleAddCustomGarment} 
              className="shrink-0 px-4 py-2 rounded-xl bg-theme-text text-white text-[10px] font-black uppercase tracking-wider hover:bg-emerald-900 transition-all shadow-md shadow-theme-text/10 active:scale-95"
            >
              Custom
            </button>
          </div>
        </div>

        {/* Frequently Ordered (Phase 2) */}
        {!searchQuery && activeCategory === 'All' && (
          <div className="mb-6 animate-fade-in">
            <h4 className="text-[9px] font-black uppercase tracking-[0.15em] text-theme-text-muted/40 mb-3 px-1">Quick Add</h4>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {pricing.slice(0, 5).map((item, idx) => (
                <button
                  key={`quick-${idx}`}
                  onClick={() => addToCart(item)}
                  className="shrink-0 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 hover:bg-emerald-100 transition-all flex items-center gap-2 group shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">
                    {getGarmentIcon(item.garment_type)}
                  </span>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black leading-tight">{item.garment_type}</span>
                    <span className="text-[8px] font-bold opacity-60 uppercase tracking-tighter">{item.service_type}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-5">
            {filteredPricing.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => addToCart(item)}
                  className="bg-theme-surface p-4 rounded-[2rem] border border-theme-border/60 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 hover:border-emerald-500/30 transition-all duration-500 cursor-pointer group relative overflow-hidden animate-fade-in-up flex flex-col"
                  style={{ animationDelay: \`\${idx * 40}ms\` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    {/* Icon Area */}
                    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-theme-surface-container/50 rounded-2xl flex items-center justify-center text-theme-text-muted/40 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all duration-700 group-hover:scale-105 shrink-0">
                      <span className="material-symbols-outlined text-2xl lg:text-3xl transition-transform duration-700 group-hover:rotate-6">
                        {getGarmentIcon(item.garment_type)}
                      </span>
                    </div>

                    {/* Price Badge */}
                    <div className="bg-theme-surface-container/30 text-theme-text text-[11px] font-black px-3 py-1.5 rounded-full ring-1 ring-theme-border/40 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:ring-emerald-200 transition-all duration-500 shrink-0">
                      ₹{item.price}
                    </div>
                  </div>
                  
                  {/* Text */}
                  <div className="space-y-1 mt-auto">
                    <h4 className="font-black text-theme-text text-sm tracking-tight group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {item.garment_type}
                    </h4>
                    <p className="text-[9px] font-bold text-theme-text-muted/50 uppercase tracking-[0.15em] line-clamp-1">
                      {item.service_type}
                    </p>
                  </div>

                  {/* Add Hint */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
});

export default ServiceCatalog;
