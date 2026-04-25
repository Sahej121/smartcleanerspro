'use client';

import React from 'react';

export default function MasterLogs({
  logs,
  t
}) {
  return (
    <div className="space-y-8 animate-fade-in flex flex-col h-[75vh]">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
             <h1 className="text-4xl font-black font-headline uppercase leading-none">{t('global_logs')}</h1>
             <p className="text-slate-500 italic mt-2">{t('real_time_logs_desc')}</p>
          </div>
          <div className="flex gap-4">
             <div className="relative w-72 group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                <input 
                  type="text" 
                  placeholder={t('filter_logs_placeholder')} 
                  className="w-full bg-white border border-slate-100 rounded-2xl py-3.5 pl-12 pr-6 text-xs font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none shadow-sm transition-all"
                />
             </div>
             <button className="px-8 py-3 bg-theme-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">{t('export_data_hub')}</button>
          </div>
       </div>

       <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50/50 px-10 py-5 border-b border-slate-100">
             <div className="grid grid-cols-12 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div className="col-span-2">{t('timestamp')}</div>
                <div className="col-span-2">{t('source_type')}</div>
                <div className="col-span-6">{t('description_payload')}</div>
                <div className="col-span-2 text-right">{t('severity_index')}</div>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto px-10 py-4 space-y-2 no-scrollbar">
             {logs.map((log, i) => (
                <div key={log.id} className="grid grid-cols-12 items-center py-5 px-4 hover:bg-slate-50 rounded-2xl transition-all group animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                   <div className="col-span-2 flex flex-col">
                      <span className="text-[10px] font-black text-slate-900 font-mono tracking-tighter">{new Date(log.created_at).toLocaleTimeString()}</span>
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{new Date(log.created_at).toLocaleDateString()}</span>
                   </div>
                   <div className="col-span-2">
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase tracking-tight text-slate-500 group-hover:bg-emerald-900 group-hover:text-white transition-all">
                         {log.event_type}
                      </span>
                   </div>
                   <div className="col-span-6 pr-10">
                      <p className="text-xs font-bold text-on-surface leading-snug line-clamp-1 group-hover:line-clamp-none transition-all">{log.description}</p>
                   </div>
                   <div className="col-span-2 text-right flex items-center justify-end gap-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-700 transition-colors">{log.severity}</span>
                      <div className={`w-2 h-2 rounded-full ${log.severity === 'error' ? 'bg-red-500 animate-pulse' : log.severity === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
}
