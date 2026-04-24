'use client';

import React from 'react';
import { AnimatedTotal } from '@/components/common/AnimatedStats';

export default function OrderCart({
  cart,
  removeFromCart,
  updateItemPrice,
  getGarmentIcon,
  subtotal,
  applicableVolDiscount,
  volDiscountInfo,
  tax,
  couponData,
  couponDiscount,
  redeemedPoints,
  total,
  couponCode,
  setCouponCode,
  handleApplyCoupon,
  setCurrentStep,
  setItemEditIndex,
  setItemEditData,
  setStainError,
  setShowItemEditModal,
  selectedCustomer,
  t,
  customerHeader
}) {
  return (
    <div className="lg:col-span-4 flex flex-col overflow-hidden min-h-[500px] lg:min-h-0 animate-fade-in-up stagger-3">
      <div className="bg-theme-surface rounded-[2rem] border border-theme-border/50 shadow-xl shadow-emerald-900/5 flex flex-col overflow-hidden h-full">
        {/* Summary Header */}
        {customerHeader}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
              <span className="material-symbols-outlined text-6xl mb-4 animate-float">shopping_bag</span>
              <p className="text-xs font-black uppercase tracking-widest text-center leading-relaxed">Cart is waiting<br/>for orders</p>
            </div>
          ) : (
            cart.map((item, i) => (
              <div key={i} className="flex flex-col gap-2 p-3 bg-theme-surface rounded-2xl border border-theme-border animate-slide-in-right" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-lg bg-theme-surface-container flex items-center justify-center text-theme-text">
                    <span className="material-symbols-outlined text-lg">{getGarmentIcon(item.garment_type)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h5 className="text-xs font-bold text-theme-text">{item.garment_type}</h5>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-theme-text-muted/70">₹</span>
                        <input 
                          type="number" 
                          className="w-16 bg-theme-surface-container border-none rounded p-1 text-xs font-bold text-right outline-none focus:ring-1 focus:ring-emerald-500/20"
                          value={item.price}
                          onChange={(e) => updateItemPrice(i, e.target.value)}
                        />
                      </div>
                    </div>
                    <p className="text-[9px] text-theme-text-muted/70 font-bold uppercase tracking-wider">{item.service_type}</p>
                  </div>
                  <button onClick={() => removeFromCart(i)} className="text-theme-text-muted/70 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-theme-border mt-1">
                   <div className="flex gap-2">
                      {item.tag_id ? (
                        <span className="px-2 py-0.5 bg-theme-surface-container text-emerald-600 rounded text-[8px] font-black uppercase tracking-tight italic">Tag: {item.tag_id}</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-theme-surface-container text-theme-text-muted/70 rounded text-[8px] font-bold uppercase tracking-tight">No Tag</span>
                      )}
                      {item.bag_id && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black uppercase tracking-tight italic">Bag: {item.bag_id}</span>
                      )}
                   </div>
                   <button 
                     onClick={() => {
                       setItemEditIndex(i);
                       setItemEditData({
                         tag_id: item.tag_id || '',
                         bag_id: item.bag_id || '',
                         notes: item.notes || '',
                         fabric_hint: item.fabric_hint || '',
                         stain_analysis: item.stain_analysis || null
                       });
                       setStainError('');
                       setShowItemEditModal(true);
                     }}
                     className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:text-theme-text"
                   >
                     <span className="material-symbols-outlined text-[12px]">edit_note</span>
                     Track
                   </button>
                </div>
                {item.notes && (
                  <p className="text-[8px] text-amber-600 font-medium italic truncate px-1">Note: {item.notes}</p>
                )}
                {item.stain_analysis?.stains?.[0] && (
                  <div className="px-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[8px] font-black uppercase tracking-tight">
                      <span className="material-symbols-outlined text-[10px]">biotech</span>
                      {item.stain_analysis.stains[0].label} ({Math.round((item.stain_analysis.stains[0].confidence || 0) * 100)}%)
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Summary Totals */}
        <div className="p-6 bg-theme-surface-container/50 border-t border-theme-border">
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-xs font-medium text-theme-text-muted">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {applicableVolDiscount > 0 && (
              <div className="flex justify-between text-xs font-medium text-blue-600 animate-fade-in">
                <span>Volume Discount ({volDiscountInfo.discount_percent}%)</span>
                <span>-₹{applicableVolDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-medium text-theme-text-muted">
              <span>{t('tax_label_18')}</span>
              <span>₹{tax.toLocaleString('en-IN')}</span>
            </div>
            {couponData && (
              <div className="flex justify-between text-xs font-medium text-purple-600 animate-fade-in">
                <span>Promo: {couponData.code}</span>
                <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            {selectedCustomer && (
              <div className="flex justify-between text-xs font-medium text-emerald-600">
                <span>{t('member_advantage')}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-theme-surface-container px-1.5 rounded">{t('applied')}</span>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <input 
                type="text" 
                placeholder={t('promo_code_placeholder')} 
                className="flex-1 bg-theme-surface border border-theme-border rounded-xl px-3 py-2 text-[10px] font-black tracking-widest outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
              />
              <button 
                onClick={handleApplyCoupon}
                className="px-4 py-2 bg-theme-text text-background rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
              >
                Apply
              </button>
            </div>
            <div className="pt-4 border-t border-theme-border flex justify-between items-end">
              <span className="text-sm font-black uppercase tracking-widest text-theme-text">Total</span>
              <span className="text-2xl font-black text-theme-text">
                <AnimatedTotal value={total} />
              </span>
            </div>
          </div>
          <button 
            disabled={cart.length === 0 || !selectedCustomer}
            onClick={() => setCurrentStep(3)}
            className="w-full primary-gradient text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-900/20 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            <span>{t('proceed_to_schedule')}</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
