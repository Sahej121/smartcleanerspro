'use client';

import React from 'react';

export default function CredentialsModal({ credentials, onClose, t }) {
  if (!credentials) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[3rem] w-full max-w-md p-6 lg:p-12 shadow-2xl animate-fade-in-up border-4 border-emerald-500/20 relative overflow-hidden">
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl rotate-3">
            <span className="material-symbols-outlined text-4xl">cloud_done</span>
          </div>
          <h2 className="text-3xl font-black font-headline uppercase italic text-on-surface leading-none mb-2">{t('nexus_linked')}</h2>
          <p className="text-slate-500 font-medium italic mb-10">
            {credentials.isManager ? 'Manager credentials' : 'Root Owner credentials'} generated for <strong>{credentials.storeName}</strong>.
          </p>
          
          {(credentials.password || credentials.pin) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-emerald-200 transition-all">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                  {credentials.isManager ? 'Manager Password' : 'Store Admin Password'}
                </p>
                <p className="text-sm font-black text-on-surface font-mono select-all">
                  {credentials.password}
                </p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 group hover:border-emerald-400 transition-all">
                <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Floor Access PIN</p>
                <p className="text-xl font-black text-emerald-900 font-mono tracking-widest select-all">
                  {credentials.pin || '####'}
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-10 p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
              <p className="text-xs font-bold text-slate-500 italic uppercase">Node linked to existing credentials</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Use your existing owner/manager login for this branch.</p>
            </div>
          )}

          <div className="bg-amber-50 p-4 rounded-2xl flex gap-3 text-left mb-10">
            <span className="material-symbols-outlined text-amber-600">warning</span>
            <p className="text-[10px] font-bold text-amber-800 leading-relaxed italic uppercase">Transmit these credentials securely. Keys will be encrypted upon first synchronization.</p>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-5 premium-gradient text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/10 active:scale-95 transition-all"
          >
            Finalize Dispatch
          </button>
        </div>
      </div>
    </div>
  );
}
