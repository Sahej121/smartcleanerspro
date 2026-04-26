'use client';

import React from 'react';

export default function MasterSecurity({
  t,
  health,
  logs,
  broadcastMessage,
  setBroadcastMessage,
  handleSendBroadcast,
  isBroadcasting
}) {
  const resourceUsage = health?.resource_usage || {
    db_load: 0,
    node_cpu: 0,
    socket_latency: 0,
  };
  const incidents = health?.incidents || { errors_24h: 0, warnings_24h: 0 };
  const services = Array.isArray(health?.services) ? health.services : [];
  const recentSecurityLogs = Array.isArray(logs)
    ? logs.filter((log) => ['error', 'warning'].includes(log.severity)).slice(0, 4)
    : [];

  return (
    <div className="space-y-8 animate-fade-in font-sans">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
             <h1 className="text-4xl font-black font-headline uppercase leading-none italic tracking-tight">{t('security_health')}</h1>
             <p className="text-slate-500 italic mt-2">{t('security_desc')}</p>
          </div>
          <div className="flex items-center gap-4 px-8 py-4 bg-theme-surface-container rounded-[2rem] border border-primary/20 shadow-sm">
             <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">{t('network_shield_active')}</span>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden group">
                   <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8 font-headline">{t('resource_usage')}</h4>
                   <div className="space-y-8">
                      {[
                         { label: 'Multi-tenant DB Load', val: resourceUsage.db_load, icon: 'database' },
                         { label: 'Node CPU Aggregation', val: resourceUsage.node_cpu, icon: 'memory' },
                         { label: 'Socket Cluster Latency', val: resourceUsage.socket_latency, icon: 'lan' },
                      ].map((item, idx) => (
                         <div key={idx} className="space-y-3">
                            <div className="flex justify-between items-center">
                               <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-slate-400 text-sm">{item.icon}</span>
                                  <span className="text-[10px] font-black uppercase text-on-surface tracking-widest">{item.label}</span>
                               </div>
                               <span className="text-xs font-black italic">{item.val}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                               <div className="h-full bg-primary group-hover:bg-emerald-600 transition-all duration-700" style={{ width: `${item.val}%`, transitionDelay: `${idx * 100}ms` }}></div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="bg-theme-surface-container rounded-[2.5rem] p-10 shadow-sm border border-theme-border relative overflow-hidden">
                   <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-8 font-headline">{t('threat_intelligence')}</h4>
                   <div className="flex items-end gap-3 mb-8">
                      <span className="text-6xl font-black italic tracking-tighter leading-none">{String(incidents.errors_24h || 0).padStart(2, '0')}</span>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 leading-tight">{t('security_incidents')}</p>
                   </div>
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{t('lockdown_index')}</p>
                      <div className="flex gap-1 h-8 items-end">
                         {[...Array(12)].map((_, i) => (
                            <div key={i} className="flex-1 bg-emerald-500/20 rounded-t-[2px]" style={{ height: `${Math.max(12, (incidents.warnings_24h || 0) * 8 + ((i % 4) + 1) * 12)}%` }}></div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm group">
                <div className="flex justify-between items-center mb-8">
                   <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 font-headline">{t('infrastructure_broadcast')}</h4>
                   <span className="material-symbols-outlined text-red-500 animate-pulse text-xl">emergency_home</span>
                </div>
                <div className="flex gap-4 p-2 bg-slate-50 rounded-[2.2rem] border border-slate-100 ring-4 ring-transparent focus-within:ring-red-500/5 transition-all">
                   <input 
                     type="text" 
                     placeholder={t('broadcast_placeholder_emergency')}
                     className="flex-1 bg-transparent border-none py-5 px-8 text-sm font-bold focus:ring-0 outline-none placeholder:text-slate-400"
                     value={broadcastMessage}
                     onChange={(e) => setBroadcastMessage(e.target.value)}
                   />
                   <button 
                     onClick={handleSendBroadcast}
                     disabled={isBroadcasting || !broadcastMessage.trim()}
                     className="px-10 py-5 bg-red-600 text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-900/10 active:scale-95 disabled:opacity-50 transition-all hover:bg-red-700"
                   >
                      {isBroadcasting ? 'Dispatching...' : t('transmit_emergency')}
                   </button>
                </div>
             </div>
          </div>

          <div className="space-y-8">
             <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl relative overflow-hidden flex flex-col justify-between h-full">
                <div>
                   <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-10 font-headline">{t('global_health_index')}</h4>
                   <div className="space-y-12">
                      {services.map((service, i) => (
                         <div key={i} className="group cursor-default">
                            <div className="flex justify-between items-center mb-3">
                               <span className="text-[11px] font-black uppercase text-on-surface tracking-tighter group-hover:text-emerald-700 transition-colors">{service.label}</span>
                               <span className="text-[10px] font-black text-slate-900 italic">{service.health}%</span>
                            </div>
                            <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                               <div className={`h-full ${service.status === 'notice' ? 'bg-amber-500' : 'bg-emerald-500'} shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000`} style={{ width: `${service.health}%` }}></div>
                            </div>
                         </div>
                      ))}
                      {services.length === 0 && (
                        <p className="text-xs font-bold text-slate-400 italic">No service telemetry available.</p>
                      )}
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-slate-50">
                   <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.3em] leading-relaxed text-center italic">
                      {t('verified_infrastructure_status')}:<br/>
                      {new Date().toLocaleString()}
                   </p>
                </div>
             </div>

             <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 font-headline">Recent Alerts</h4>
                <div className="space-y-4">
                  {recentSecurityLogs.map((log) => (
                    <div key={log.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{log.event_type}</span>
                        <span className={`text-[9px] font-black uppercase ${log.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`}>{log.severity}</span>
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-600">{log.description}</p>
                    </div>
                  ))}
                  {recentSecurityLogs.length === 0 && (
                    <p className="text-xs font-bold text-slate-400 italic">No recent warning or error events.</p>
                  )}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
