'use client';

import React from 'react';

export default function DeleteStoreModal({ 
  isOpen, 
  onClose, 
  modalState, 
  setModalState, 
  isDeleting, 
  handleDeleteStore, 
  t 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-red-100 overflow-hidden animate-fade-in-up">
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <div>
              <h3 className="text-xl font-black font-headline uppercase tracking-tighter">{t('node_termination')}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Step {modalState.step} of 3</p>
            </div>
          </div>

          {modalState.step === 1 && (
            <div className="space-y-4">
              <p className="text-slate-600 font-medium leading-relaxed">
                You are about to permanently terminate node <span className="font-black text-red-600 underline">"{modalState.name}"</span>. 
                This will irreversibly destroy all data:
              </p>
              <ul className="grid grid-cols-2 gap-2">
                {['Customer Data', 'Order History', 'Payment Records', 'Staff Accounts', 'Machine Loads', 'Inventory & Pricing'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <span className="material-symbols-outlined text-sm text-red-300">close</span> {f}
                  </li>
                ))}
              </ul>
              <div className="pt-4 flex gap-3">
                <button onClick={() => setModalState({ ...modalState, step: 2 })} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/10 active:scale-95 transition-all">Proceed to Verification</button>
                <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">Abort</button>
              </div>
            </div>
          )}

          {modalState.step === 2 && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100">
                 <p className="text-sm font-bold text-amber-800 leading-relaxed">
                   I understand that this action is <span className="underline italic font-black">irreversible</span> and no backup can restore this node's data once the termination is finalized.
                 </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setModalState({ ...modalState, step: 3 })} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/10 active:scale-95 transition-all">{t('confirm_irreversible')}</button>
                <button onClick={() => setModalState({ ...modalState, step: 1 })} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">Go Back</button>
              </div>
            </div>
          )}

          {modalState.step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">{t('final_confirmation_protocol')}</label>
                <p className="text-xs font-bold text-slate-500 mb-2">Type <span className="bg-slate-100 px-1.5 py-0.5 rounded text-red-600 font-mono">DELETE {modalState.name}</span> to finalize node termination.</p>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none text-red-600 transition-all font-mono"
                  placeholder={`DELETE ${modalState.name}`}
                  value={modalState.confirmText}
                  onChange={e => setModalState({ ...modalState, confirmText: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleDeleteStore}
                  disabled={modalState.confirmText !== `DELETE ${modalState.name}` || isDeleting}
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/10 active:scale-95 transition-all disabled:opacity-40 disabled:grayscale"
                >
                  {isDeleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      Terminating Node...
                    </span>
                  ) : t('execute_node_termination')}
                </button>
                <button onClick={onClose} className="py-4 px-8 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">Abort</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
