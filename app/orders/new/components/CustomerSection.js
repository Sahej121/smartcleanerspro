'use client';

import React from 'react';
import { createPortal } from 'react-dom';

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
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <div className="p-6 border-b border-theme-border/60 bg-theme-surface-container/20 backdrop-blur-md">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-theme-text-muted/50">Current Order</h3>
        <span className="text-[9px] font-black bg-theme-text text-white px-2.5 py-1 rounded-full shadow-sm tracking-wider">
          ORD-{Math.random().toString(36).substring(2, 6).toUpperCase()}
        </span>
      </div>

      {/* Customer Selection */}
      {!selectedCustomer ? (
        <div 
          onClick={() => setIsCustomerSearchOpen(true)}
          className="flex items-center gap-4 p-4 bg-theme-surface rounded-[1.5rem] border border-theme-border/80 cursor-pointer hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-500/30 transition-all duration-500 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-theme-surface-container text-theme-text flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 group-hover:rotate-6 shadow-inner">
            <span className="material-symbols-outlined text-2xl">person_add</span>
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-black uppercase tracking-widest text-theme-text group-hover:text-emerald-700 transition-colors">Assign Client</p>
            <p className="text-[10px] font-medium text-theme-text-muted/60 mt-0.5">Search by name or phone</p>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-theme-text-muted/30 group-hover:text-emerald-500 transition-colors">
            <span className="material-symbols-outlined">search</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 bg-theme-surface rounded-[1.5rem] border border-emerald-500/20 animate-slide-in-right shadow-sm relative overflow-hidden group" style={{ animationDuration: '0.4s' }}>
          <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          <div className="w-12 h-12 rounded-2xl primary-gradient flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-900/10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
            {selectedCustomer.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-theme-text truncate tracking-tight">{selectedCustomer.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {selectedCustomer.loyalty_points || 0} pts
              </span>
              <span className="text-[9px] font-bold text-theme-text-muted/50 uppercase tracking-widest truncate">
                • {selectedCustomer.phone}
              </span>
            </div>
          </div>
          <button 
            onClick={() => setSelectedCustomer(null)}
            className="w-10 h-10 flex items-center justify-center text-theme-text-muted/40 hover:bg-theme-surface-container hover:text-emerald-600 rounded-xl transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-xl">cached</span>
          </button>
        </div>
      )}

      {/* Customer Search Overlay */}
      {mounted && isCustomerSearchOpen ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-theme-text/20 backdrop-blur-md animate-fade-in">
          <div className="bg-theme-surface rounded-[2.5rem] shadow-2xl border border-theme-border/60 p-8 w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-theme-text tracking-tight">Client Search</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted/40 mt-1">Find or Register Client</p>
              </div>
              <button 
                onClick={() => setIsCustomerSearchOpen(false)} 
                className="w-10 h-10 flex items-center justify-center hover:bg-theme-surface-container rounded-full transition-colors text-theme-text-muted"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="relative group mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-theme-text-muted/40 group-focus-within:text-emerald-500 transition-colors">search</span>
              </div>
              <input 
                autoFocus
                className="w-full bg-theme-surface-container border border-transparent rounded-[1.25rem] py-4 pl-12 pr-4 text-sm font-black placeholder:text-theme-text-muted/30 outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-theme-surface focus:border-emerald-500/20 transition-all shadow-inner"
                placeholder="Name or phone number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="max-h-72 overflow-y-auto pr-2 space-y-2 no-scrollbar mb-4">
              {!isInlineCreating ? (
                filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c, i) => (
                    <div 
                      key={c.id} 
                      onClick={() => { setSelectedCustomer(c); setIsCustomerSearchOpen(false); setCurrentStep(2); }}
                      className="p-4 rounded-[1.5rem] hover:bg-emerald-50 cursor-pointer flex justify-between items-center transition-all group animate-fade-in-up border border-transparent hover:border-emerald-500/20"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-theme-surface-container flex items-center justify-center font-black text-theme-text text-sm group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-theme-text tracking-tight">{c.name}</p>
                          <p className="text-[10px] text-theme-text-muted/50 font-bold tracking-widest">{c.phone}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-emerald-500 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">arrow_forward</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 animate-fade-in-up">
                    <div className="w-16 h-16 bg-theme-surface-container rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                      <span className="material-symbols-outlined text-3xl text-theme-text-muted/20">person_search</span>
                    </div>
                    <p className="text-[10px] text-theme-text-muted/40 uppercase font-black mb-6 tracking-[0.2em]">No client matches found</p>
                    <button 
                      onClick={() => setIsInlineCreating(true)}
                      className="px-8 py-3 bg-theme-text text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-theme-text/10 active:scale-95 transition-all"
                    >
                      Register New Client
                    </button>
                  </div>
                )
              ) : (
                <div className="py-2 animate-slide-in-right shrink-0" style={{ animationDuration: '0.3s' }}>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Quick Registration
                  </p>
                  {inlineError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-[10px] font-black mb-6 animate-shake uppercase tracking-widest">
                      {inlineError}
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black uppercase tracking-widest text-theme-text-muted/40 ml-4">Full Name</label>
                       <input 
                        autoFocus
                        className="w-full bg-theme-surface-container border border-transparent rounded-2xl py-4 px-5 text-sm font-black focus:ring-4 focus:ring-emerald-500/5 focus:bg-theme-surface focus:border-emerald-500/20 placeholder:text-theme-text-muted/20 transition-all outline-none shadow-inner" 
                        placeholder="e.g. John Doe" 
                        value={newCustomer.name} 
                        onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black uppercase tracking-widest text-theme-text-muted/40 ml-4">Phone Number</label>
                       <input 
                        className="w-full bg-theme-surface-container border border-transparent rounded-2xl py-4 px-5 text-sm font-black focus:ring-4 focus:ring-emerald-500/5 focus:bg-theme-surface focus:border-emerald-500/20 placeholder:text-theme-text-muted/20 transition-all outline-none shadow-inner" 
                        placeholder="10-digit number" 
                        value={newCustomer.phone} 
                        onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} 
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button onClick={() => setIsInlineCreating(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-theme-text-muted/50 hover:bg-theme-surface-container rounded-2xl transition-all">Cancel</button>
                      <button 
                        onClick={handleCreateCustomer} 
                        disabled={!newCustomer.name || !newCustomer.phone} 
                        className="flex-1 py-4 primary-gradient text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/10 disabled:opacity-20 active:scale-95 transition-all"
                      >
                        Save & Assign
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!isInlineCreating && filteredCustomers.length > 0 && (
              <div className="mt-4 pt-6 border-t border-theme-border/60 animate-fade-in-up">
                <button onClick={() => setIsInlineCreating(true)} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 w-full justify-center p-4 rounded-2xl hover:bg-emerald-50 transition-all">
                  <span className="material-symbols-outlined text-xl">person_add</span>
                  Create New Client
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}
