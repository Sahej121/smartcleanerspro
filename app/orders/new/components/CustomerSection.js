'use client';

import React from 'react';

export default function CustomerSection({
  selectedCustomer,
  setSelectedCustomer,
  isCustomerSearchOpen,
  setIsCustomerSearchOpen,
  searchQuery,
  setSearchQuery,
  filteredCustomers,
  isInlineCreating,
  setIsInlineCreating,
  inlineError,
  setInlineError,
  newCustomer,
  setNewCustomer,
  handleCreateCustomer,
  setCurrentStep,
  t
}) {
  return (
    <div className="p-6 border-b border-theme-border bg-theme-surface-container/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-extrabold text-theme-text">{t('order_summary')}</h3>
        <span className="text-[10px] font-black bg-emerald-100 text-theme-text px-2 py-1 rounded-lg">
          #{Math.random().toString(36).substring(2, 6).toUpperCase()}
        </span>
      </div>

      {/* Customer Selection */}
      {!selectedCustomer ? (
        <div 
          onClick={() => setIsCustomerSearchOpen(true)}
          className="flex items-center gap-3 p-3 bg-theme-surface rounded-xl border border-theme-border/50 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-theme-surface-container text-theme-text flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
            <span className="material-symbols-outlined">person_add</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold">{t('assign_customer')}</p>
            <p className="text-[10px] text-theme-text-muted">{t('search_name_phone')}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-theme-surface rounded-xl border border-theme-border/50 animate-slide-in-right" style={{ animationDuration: '0.3s' }}>
          <div className="w-10 h-10 rounded-lg primary-gradient flex items-center justify-center text-white font-bold text-sm shadow-md">
            {selectedCustomer.name.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold">{selectedCustomer.name}</p>
            <p className="text-[10px] text-theme-text-muted">Premium Member • {selectedCustomer.loyalty_points || 0} pts</p>
          </div>
          <button 
            onClick={() => setSelectedCustomer(null)}
            className="text-emerald-600 hover:bg-theme-surface-container p-1 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
        </div>
      )}

      {/* Customer Search Overlay */}
      {isCustomerSearchOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-on-surface/20 backdrop-blur-sm">
          <div className="bg-theme-surface rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(11,28,48,0.2)] border border-theme-border p-6 w-full max-w-md animate-scale-in" style={{ animationDuration: '0.25s' }}>
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-theme-text-muted/70">search</span>
              <input 
                autoFocus
                className="flex-1 bg-theme-surface-container border-none rounded-xl py-3 px-4 text-sm font-bold placeholder:text-theme-text-muted/70 outline-none"
                placeholder={t('start_typing')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button onClick={() => setIsCustomerSearchOpen(false)} className="p-2 hover:bg-theme-surface-container rounded-full transition-colors">
                <span className="material-symbols-outlined text-theme-text-muted/70 text-sm">close</span>
              </button>
            </div>
            
            <div className="max-h-72 overflow-y-auto space-y-2 no-scrollbar">
              {!isInlineCreating ? (
                filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c, i) => (
                    <div 
                      key={c.id} 
                      onClick={() => { setSelectedCustomer(c); setIsCustomerSearchOpen(false); setCurrentStep(2); }}
                      className="p-4 rounded-2xl hover:bg-theme-surface-container cursor-pointer flex justify-between items-center transition-all group animate-fade-in-up"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center font-bold text-theme-text text-xs shadow-inner">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-theme-text">{c.name}</p>
                          <p className="text-[10px] text-theme-text-muted/70 font-bold">{c.phone}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-primary text-sm opacity-0 group-hover:opacity-100 transition-all">chevron_right</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 animate-fade-in-up">
                    <div className="w-12 h-12 bg-theme-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-theme-text-muted/70">no_accounts</span>
                    </div>
                    <p className="text-[10px] text-theme-text-muted/70 uppercase font-black mb-4 tracking-widest">{t('no_client_matches')}</p>
                    <button 
                      onClick={() => setIsInlineCreating(true)}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-900/10 active:scale-95 transition-all"
                    >
                      Quick Add Client
                    </button>
                  </div>
                )
              ) : (
                <div className="py-2 animate-slide-in-right shrink-0" style={{ animationDuration: '0.2s' }}>
                  <p className="text-xs font-black uppercase tracking-widest text-theme-text mb-4 px-1">{t('quick_registration')}</p>
                  {inlineError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-[10px] font-bold mb-4 animate-shake">
                      {inlineError}
                    </div>
                  )}
                  <div className="space-y-3">
                    <input 
                      autoFocus
                      className="w-full bg-theme-surface-container border border-transparent rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-theme-surface placeholder:text-theme-text-muted/70 transition-all outline-none" 
                      placeholder="Full Name" 
                      value={newCustomer.name} 
                      onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} 
                    />
                    <input 
                      className="w-full bg-theme-surface-container border border-transparent rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-theme-surface placeholder:text-theme-text-muted/70 transition-all outline-none" 
                      placeholder={t('phone_number')} 
                      value={newCustomer.phone} 
                      onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} 
                    />
                    <input 
                      className="w-full bg-theme-surface-container border border-transparent rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:bg-theme-surface placeholder:text-theme-text-muted/70 transition-all outline-none" 
                      placeholder={t('address_optional')} 
                      value={newCustomer.address} 
                      onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} 
                    />
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setIsInlineCreating(false)} className="flex-1 py-3 text-xs font-bold text-theme-text-muted/70 hover:text-theme-text hover:bg-theme-surface-container rounded-xl transition-all">Cancel</button>
                      <button onClick={handleCreateCustomer} disabled={!newCustomer.name || !newCustomer.phone} className="flex-1 py-3 primary-gradient text-white rounded-xl text-xs font-black shadow-md disabled:opacity-50 active:scale-95 transition-all">{t('save_assign')}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Add Button underneath list if showing results */}
            {!isInlineCreating && filteredCustomers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-theme-border animate-fade-in-up">
                <button onClick={() => setIsInlineCreating(true)} className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-theme-text w-full justify-center p-3 rounded-xl hover:bg-theme-surface-container transition-colors">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  Create New Client
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
