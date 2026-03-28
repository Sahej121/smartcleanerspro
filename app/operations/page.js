'use client';

import { useState, useEffect } from 'react';
import { useUser, ROLES } from '@/lib/UserContext';

const STAGES = [
  { key: 'received', label: 'In-Take', icon: 'inbox', shadow: 'shadow-blue-900/5', accent: 'bg-blue-500' },
  { key: 'sorting', label: 'Sorting', icon: 'category', shadow: 'shadow-amber-900/5', accent: 'bg-amber-500' },
  { key: 'washing', label: 'Wash', icon: 'water_drop', shadow: 'shadow-sky-900/5', accent: 'bg-sky-500' },
  { key: 'dry_cleaning', label: 'Dry Clean', icon: 'eco', shadow: 'shadow-emerald-900/5', accent: 'bg-emerald-500' },
  { key: 'drying', label: 'Drying', icon: 'air', shadow: 'shadow-orange-900/5', accent: 'bg-orange-500' },
  { key: 'ironing', label: 'Ironing', icon: 'iron', shadow: 'shadow-pink-900/5', accent: 'bg-pink-500' },
  { key: 'quality_check', label: 'Quality', icon: 'fact_check', shadow: 'shadow-indigo-900/5', accent: 'bg-indigo-500' },
  { key: 'ready', label: 'Ready', icon: 'verified', shadow: 'shadow-primary/10', accent: 'bg-primary' },
];

export default function OperationsPage() {
  const { role } = useUser();
  const [workflow, setWorkflow] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflow();
  }, []);

  const fetchWorkflow = () => {
    fetch('/api/workflow')
      .then(r => r.json())
      .then(data => { setWorkflow(data); setLoading(false); });
  };

  const advanceItem = async (itemId) => {
    if (role === ROLES.STAFF) return; // Guard
    await fetch(`/api/workflow/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'advance' }),
    });
    fetchWorkflow();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse">Syncing Floor Control...</p>
    </div>
  );

  const canAdvance = role !== ROLES.STAFF;

  return (
    <div className="min-h-[calc(100vh-140px)] p-4 lg:p-8 flex flex-col gap-6 lg:gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-on-surface mb-2 font-headline uppercase leading-none">Floor Control</h1>
          <p className="text-on-surface-variant font-medium">
            {canAdvance ? 'Real-time Backend-of-House (BOH) Production Control' : 'Real-time Production Monitoring (Read-Only)'}
          </p>
        </div>
        <div className="flex gap-3">
           <div className="flex items-center gap-3 px-5 py-3 bg-surface-container-low rounded-[1.5rem] border border-outline-variant/10">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest leading-none">
               {canAdvance ? 'Control Mode Active' : 'Monitor Mode Active'}
             </span>
           </div>
           <button onClick={fetchWorkflow} className="w-12 h-12 rounded-[1.25rem] bg-white border border-outline-variant/10 text-slate-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm active:scale-90">
             <span className="material-symbols-outlined text-xl block">sync</span>
           </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-8 no-scrollbar -mx-2">
        <div className="flex h-full gap-8 min-w-max px-2">
          {STAGES.map((stage, idx) => {
            const items = workflow[stage.key] || [];
            return (
              <div key={stage.key} className="w-[340px] flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                {/* Column Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-surface-container-low rounded-[2rem] border border-outline-variant/10">
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-lg ${stage.key === 'ready' ? 'text-primary' : 'text-slate-400'}`}>{stage.icon}</span>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant">{stage.label}</span>
                  </div>
                  <span className="text-[11px] font-black bg-white px-3 py-1 rounded-full text-on-surface shadow-sm border border-outline-variant/5">
                    {items.length}
                  </span>
                </div>

                {/* Column Body */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 p-1">
                  {items.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/10 rounded-[2.5rem] opacity-20">
                       <span className="material-symbols-outlined mb-2">subtitles_off</span>
                       <span className="text-[9px] font-black uppercase tracking-widest leading-none">No Items</span>
                    </div>
                  ) : items.map((item, i) => (
                    <div key={item.id} className={`bg-white p-6 rounded-[2.5rem] border border-outline-variant/10 shadow-sm transition-all group animate-in slide-in-from-bottom-2 duration-300 hover:shadow-2xl hover:-translate-y-1 ${stage.shadow}`}>
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-[11px] font-black text-primary uppercase tracking-widest">{item.order_number}</span>
                        <div className={`w-2 h-2 rounded-full ${stage.accent} shadow-[0_0_8px] ${stage.key === 'ready' ? 'shadow-primary/40' : 'opacity-40'}`}></div>
                      </div>
                      
                      <div className="space-y-1 mb-8">
                        <h4 className="text-base font-black text-on-surface line-clamp-1 group-hover:text-primary transition-colors">{item.garment_type}</h4>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.service_type}</p>
                      </div>
                      
                      <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                         <div className="flex items-center gap-3 overflow-hidden">
                           <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center font-black text-slate-400 text-xs shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                             {item.customer_name?.charAt(0) || 'W'}
                           </div>
                           <div className="overflow-hidden">
                              <p className="text-[11px] font-black text-on-surface truncate leading-none mb-1">{item.customer_name || 'Walk-in'}</p>
                              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">Registered 14m ago</p>
                           </div>
                         </div>
                         {stage.key !== 'ready' && canAdvance && (
                           <button 
                             onClick={() => advanceItem(item.id)}
                             className="w-10 h-10 rounded-[1.25rem] bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90"
                           >
                              <span className="material-symbols-outlined text-base font-black">chevron_right</span>
                           </button>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
