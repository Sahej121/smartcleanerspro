'use client';

import React from 'react';
import { AnimatedTotal } from '@/components/common/AnimatedStats';

const OrderCart = React.memo(function OrderCart({
  cart,
  removeFromCart,
  updateQuantity,
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
  setShowItemEditModal,
  selectedCustomer,
  t,
  customerHeader,
  isMobileSheet = false
}) {
  const [showProceedConfirm, setShowProceedConfirm] = React.useState(false);

  return (
    <>
    <div className={`flex flex-col h-full overflow-hidden ${!isMobileSheet ? 'glass-card-premium' : ''}`}>
      {/* Summary Header */}
      {customerHeader}

        {/* Cart Items */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 no-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10">
                <div className="w-20 h-20 rounded-full bg-theme-surface-container flex items-center justify-center mb-4 animate-float">
                  <span className="material-symbols-outlined text-4xl text-theme-text-muted/30">shopping_bag</span>
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted/40 text-center">
                  No items added yet
                </h4>
                <p className="text-[9px] font-bold text-theme-text-muted/30 mt-2 tracking-widest uppercase text-center">
                  Add services from catalog
                </p>
              </div>
            ) : (
              <div className="pb-4">
                <div className="overflow-hidden rounded-[1.5rem] border-2 border-theme-border bg-theme-surface-container/70 ring-2 ring-theme-border/60">
                {cart.map((item, i) => (
                  <div
                    key={i}
                    className={`animate-slide-in-right group relative px-3 py-2.5 ${i < cart.length - 1 ? 'border-b-2 border-theme-border/90' : ''}`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                      <div className="flex min-h-[52px] w-full items-center gap-2 lg:gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-theme-surface-container text-theme-text ring-1 ring-theme-border/50">
                          <span className="material-symbols-outlined text-xl">
                            {getGarmentIcon(item.garment_type)}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                          <h5 className="truncate text-[12px] font-semibold text-theme-text">
                            {item.garment_type}
                          </h5>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="inline-block truncate text-[8px] font-black text-emerald-700 uppercase tracking-[0.08em] bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200/70">
                              {item.service_type}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-auto lg:ml-0">
                          {/* Qty Controls */}
                          <div className="shrink-0 flex items-center gap-1 bg-theme-surface px-1 py-1 rounded-xl ring-1 ring-theme-border/50">
                            <button
                              onClick={() => updateQuantity(i, (item.quantity || 1) - 1)}
                              disabled={(item.quantity || 1) <= 1}
                              className="w-7 h-7 rounded-lg bg-theme-surface-container text-theme-text flex items-center justify-center transition-all disabled:opacity-20 active:scale-90"
                              aria-label={`Decrease quantity for ${item.garment_type}`}
                            >
                              <span className="material-symbols-outlined text-[16px]">remove</span>
                            </button>
                            <span className="min-w-5 text-center text-[12px] font-black text-theme-text">
                              {item.quantity || 1}
                            </span>
                            <button
                              onClick={() => updateQuantity(i, (item.quantity || 1) + 1)}
                              className="w-7 h-7 rounded-lg bg-theme-surface-container text-theme-text flex items-center justify-center transition-all active:scale-90"
                              aria-label={`Increase quantity for ${item.garment_type}`}
                            >
                              <span className="material-symbols-outlined text-[16px]">add</span>
                            </button>
                          </div>

                          {/* Price Input */}
                          <div className="shrink-0 flex items-center gap-1 bg-theme-surface-container/50 px-2 py-1.5 rounded-xl ring-1 ring-theme-border/30 group-hover:ring-emerald-500/30 transition-all">
                            <span className="text-[10px] font-black text-theme-text-muted">₹</span>
                            <input
                              type="number"
                              className="w-10 border-none bg-transparent p-0 text-right text-[12px] font-bold text-theme-text outline-none focus:ring-0"
                              value={item.price}
                              onChange={(e) => updateItemPrice(i, e.target.value)}
                            />
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => removeFromCart(i)}
                            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-theme-text-muted/40 transition-all hover:bg-red-50 hover:text-red-500 active:scale-90"
                            aria-label={`Remove ${item.garment_type}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Summary Totals */}
        <div className="shrink-0 p-4 bg-theme-surface-container/40 border-t border-theme-border/60 backdrop-blur-md">
          <div className="space-y-2 mb-3">
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="font-bold text-theme-text-muted/70 uppercase tracking-widest">Subtotal</span>
              <span className="font-black text-theme-text">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            
            {applicableVolDiscount > 0 && (
              <div className="flex justify-between items-center text-[10px] animate-fade-in bg-blue-50/50 p-2 rounded-lg border border-blue-100/30">
                <span className="font-bold text-blue-600 uppercase tracking-widest">Volume Savings</span>
                <span className="font-black text-blue-700">-₹{applicableVolDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-bold text-theme-text-muted/70 uppercase tracking-widest">Est. Tax (18%)</span>
              <span className="font-black text-theme-text">₹{tax.toLocaleString('en-IN')}</span>
            </div>

            {couponData && (
              <div className="flex justify-between items-center text-[10px] animate-fade-in bg-purple-50/50 p-2 rounded-lg border border-purple-100/30">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-purple-600">confirmation_number</span>
                  <span className="font-bold text-purple-600 uppercase tracking-widest">{couponData.code}</span>
                </div>
                <span className="font-black text-purple-700">-₹{couponDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}

            {selectedCustomer && (
              <div className="flex items-center gap-2 py-1 px-3 bg-emerald-50/50 rounded-lg border border-emerald-100/30 w-max">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-700">Member benefits active</span>
              </div>
            )}

            <div className="mt-3 border-t border-theme-border/40 pt-3 border-b border-theme-border/40 pb-3">
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <input 
                    type="text" 
                    placeholder="PROMO CODE" 
                    className="w-full bg-theme-surface border border-theme-border/80 rounded-xl px-4 py-2 text-[10px] font-black tracking-widest outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all placeholder:text-theme-text-muted/30"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  />
                </div>
                <button 
                  onClick={handleApplyCoupon}
                  className="px-6 py-2 bg-theme-text text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-theme-text/5"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted/60">Grand Total</span>
                <div className="flex items-center gap-1">
                  <span className="text-[28px] font-black tracking-tight text-theme-text leading-none">
                    <AnimatedTotal value={total} prefix="₹" />
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            disabled={cart.length === 0}
            onClick={() => setShowProceedConfirm(true)}
            className="w-full primary-gradient text-white py-4 rounded-[1.5rem] font-black text-sm shadow-xl shadow-emerald-900/15 active:scale-[0.98] transition-all disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center gap-3 group"
          >
            <span className="uppercase tracking-widest">{t('proceed_to_schedule')}</span>
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </div>

    {showProceedConfirm && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-on-surface/40 backdrop-blur-md animate-fade-in p-4">
        <div className="w-full max-w-xl rounded-[2rem] border border-theme-border bg-theme-surface shadow-2xl animate-scale-in max-h-[85vh] flex flex-col overflow-hidden">
          <div className="p-5 border-b border-theme-border/60 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-theme-text uppercase tracking-[0.12em]">Confirm Order Items</h3>
                <p className="text-[10px] font-bold text-theme-text-muted/70 uppercase tracking-wider mt-1">
                  Review or edit items before scheduling
                </p>
              </div>
              <button
                onClick={() => setShowProceedConfirm(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-theme-text-muted hover:bg-theme-surface-container transition-all"
                aria-label="Close confirmation"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 no-scrollbar">
            {cart.map((item, i) => (
              <div key={`${item.garment_type}-${i}`} className={`py-3 ${i < cart.length - 1 ? 'border-b border-theme-border/50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-theme-surface-container text-theme-text ring-1 ring-theme-border/50">
                    <span className="material-symbols-outlined text-lg">
                      {getGarmentIcon(item.garment_type)}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-theme-text">{item.garment_type}</p>
                    <span className="inline-block mt-1 max-w-full truncate text-[9px] font-black uppercase tracking-[0.08em] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200/70">
                      {item.service_type}
                    </span>
                    <button
                      onClick={() => {
                        setItemEditIndex(i);
                        setShowProceedConfirm(false);
                        setShowItemEditModal(true);
                      }}
                      className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                      Edit tracking details
                    </button>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 bg-theme-surface px-1.5 py-1 rounded-xl ring-1 ring-theme-border/50">
                    <button
                      onClick={() => updateQuantity(i, (item.quantity || 1) - 1)}
                      disabled={(item.quantity || 1) <= 1}
                      className="w-6 h-6 rounded-lg bg-theme-surface-container text-theme-text flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label={`Decrease quantity for ${item.garment_type}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">remove</span>
                    </button>
                    <span className="min-w-5 text-center text-[12px] font-black text-theme-text">{item.quantity || 1}</span>
                    <button
                      onClick={() => updateQuantity(i, (item.quantity || 1) + 1)}
                      className="w-6 h-6 rounded-lg bg-theme-surface-container text-theme-text flex items-center justify-center transition-all"
                      aria-label={`Increase quantity for ${item.garment_type}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                    </button>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 bg-theme-surface px-2 py-1.5 rounded-xl ring-1 ring-theme-border/50">
                    <span className="text-[10px] font-black text-theme-text-muted">₹</span>
                    <input
                      type="number"
                      className="w-12 border-none bg-transparent p-0 text-right text-[12px] font-black text-theme-text outline-none focus:ring-0"
                      value={item.price}
                      onChange={(e) => updateItemPrice(i, e.target.value)}
                    />
                  </div>

                  <button
                    onClick={() => removeFromCart(i)}
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-theme-text-muted/40 transition-all hover:bg-red-50 hover:text-red-500 active:scale-90"
                    aria-label={`Remove ${item.garment_type}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-theme-border/60 bg-theme-surface-container/40 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-black text-theme-text mb-3 uppercase tracking-wider">
              <span>Current Total</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowProceedConfirm(false)}
                className="flex-1 py-3 bg-theme-surface-container text-theme-text-muted rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-theme-surface-container/80 transition-colors"
              >
                Keep Editing
              </button>
              <button
                disabled={cart.length === 0}
                onClick={() => {
                  setShowProceedConfirm(false);
                  setCurrentStep(3);
                }}
                className="flex-1 py-3 primary-gradient text-white rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-30 disabled:pointer-events-none"
              >
                Confirm & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
});

export default OrderCart;
