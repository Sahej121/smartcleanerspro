'use client';

import React from 'react';
import { AnimatedCounter } from '@/components/common/AnimatedStats';
import { formatCurrency } from '@/lib/currency-utils';

export default function MasterOverview({ 
  user, 
  owners, 
  stores, 
  masterStats, 
  health, 
  logs, 
  t, 
  router, 
  fetchData, 
  setShowCreateModal,
  broadcastSeverity,
  setBroadcastSeverity,
  broadcastMessage,
  setBroadcastMessage,
  handleSendBroadcast,
  isBroadcasting
}) {
  const totalStores = user?.id == 1 ? owners.reduce((acc, o) => acc + (o.stores?.length || 0), 0) : stores.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-fade-in-up">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline uppercase leading-none">{t('global_oversight')}</h1>
          <p className="text-on-surface-variant font-medium text-lg italic">{t('master_instance')}: {totalStores} {t('nodes_online')}</p>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 premium-gradient text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-900/10 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            {t('provision_node')}
          </button>
          <button 
            onClick={fetchData}
            className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-900/10 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">sync</span>
            {t('sync_system')}
          </button>
        </div>
      </div>

      {/* Broadcast Bar */}
      <div className="bg-emerald-50/50 p-4 rounded-[2rem] border border-emerald-100/50 flex flex-col md:flex-row items-center gap-4 animate-fade-in-up">
         <div className="flex items-center gap-3 px-4">
            <span className="material-symbols-outlined text-emerald-600 animate-pulse">campaign</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 whitespace-nowrap">{t('global_broadcast')}</span>
         </div>
         <div className="flex-1 w-full flex gap-2">
            <select 
              value={broadcastSeverity}
              onChange={(e) => setBroadcastSeverity(e.target.value)}
              className="bg-white border-none rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
            >
               <option value="info">{t('info')}</option>
               <option value="warning">{t('warning')}</option>
               <option value="error">{t('critical')}</option>
            </select>
            <input 
              type="text"
              placeholder={t('broadcast_placeholder')}
              className="flex-1 bg-white border-none rounded-xl py-3 px-6 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none shadow-sm"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendBroadcast()}
            />
            <button 
              onClick={handleSendBroadcast}
              disabled={isBroadcasting || !broadcastMessage.trim()}
              className="px-8 py-3 bg-theme-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 transition-all shadow-lg"
            >
               {isBroadcasting ? t('sending') : t('transmit')}
            </button>
         </div>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 bg-white rounded-3xl p-8 flex flex-col justify-between border border-slate-100 shadow-sm animate-fade-in-up relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('total_global_revenue')}</span>
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 rounded-full text-[9px] font-black">
                <span className="material-symbols-outlined text-[12px]">trending_up</span> +12%
              </span>
            </div>
            <h2 className="text-5xl font-black text-on-surface font-headline">
              <AnimatedCounter value={masterStats?.total_revenue || 142850} prefix="$" duration={2000} />
            </h2>
          </div>
          <div className="mt-8 h-20 flex items-end gap-1.5 relative z-10">
            {[0.3, 0.28, 0.35, 0.32, 0.45, 0.42, 0.65, 0.9].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-lg bg-emerald-200 group-hover:bg-emerald-500 transition-all duration-500" style={{ height: `${h * 100}%`, transitionDelay: `${i * 50}ms` }}></div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 flex flex-col justify-between border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all">
          <span className="material-symbols-outlined text-emerald-700 text-2xl mb-4 group-hover:scale-110 transition-transform">dns</span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('active_nodes_count')}</p>
            <h2 className="text-5xl font-black font-headline">{stores.length}</h2>
          </div>
        </div>

        <div className={`${health?.status === 'OPERATIONAL' ? 'bg-primary' : 'bg-amber-700'} text-white rounded-3xl p-8 flex flex-col justify-between shadow-xl shadow-emerald-900/10`}>
          <span className="material-symbols-outlined text-white text-2xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>shield_heart</span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100 opacity-70">{t('sla_uptime')}</p>
            <h2 className="text-5xl font-black font-headline">{health?.uptime || '99.9%'}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
        <div className="col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-hidden">
            <h3 className="text-xl font-bold font-headline mb-6 border-b border-slate-50 pb-4">{t('recent_store_activity')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="text-[10px] uppercase font-black text-slate-400 border-b border-slate-50">
                    <th className="py-4 text-left">{t('node_identity')}</th>
                    <th className="py-4 text-left">{t('status')}</th>
                    <th className="py-4 text-right">{t('revenue')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.slice(0, 4).map((store) => (
                    <tr key={store.id} className="border-b border-slate-50/50 hover:bg-slate-50 transition-colors">
                      <td className="py-5 font-black text-sm text-on-surface">{store.store_name}</td>
                      <td className="py-5 capitalize text-xs font-bold text-slate-500">
                        <span className={`px-2 py-1 rounded-lg ${store.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                           {store.status}
                        </span>
                      </td>
                      <td className="py-5 text-right font-black text-sm">{formatCurrency(store.total_revenue, store.country || 'United Kingdom')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => router.push('/master/nodes')} className="w-full mt-6 py-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all font-headline">
              {t('enter_cluster_mgmt')}
            </button>
          </div>
          
          <div className="bg-theme-surface-container rounded-[2.5rem] p-8 relative overflow-hidden group">
             <div className="relative z-10">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary/80 mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">query_stats</span>
                  Packet Latency Spectrum
                </h4>
                <div className="flex gap-1.5 h-16 items-end">
                  {[...Array(24)].map((_, i) => (
                    <div key={i} className="flex-1 bg-emerald-500/10 relative rounded-t-sm group-hover:bg-emerald-500/20 transition-all">
                       <div className="absolute bottom-0 w-full bg-emerald-400/40 animate-pulse" style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 100}ms` }}></div>
                    </div>
                  ))}
                </div>
             </div>
             <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/10 to-transparent"></div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm h-full relative overflow-hidden">
          <h3 className="text-lg font-black font-headline uppercase mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">terminal</span>
            {t('security_audit')}
          </h3>
          <div className="space-y-6 relative z-10">
            {Array.isArray(logs) && logs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex gap-4 group">
                <div className={`w-1.5 h-1.5 mt-2 rounded-full shrink-0 ${log.severity === 'error' ? 'bg-red-500' : log.severity === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'} group-hover:scale-150 transition-transform`}></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-on-surface tracking-tighter">{log.event_type}</p>
                  <p className="text-[10px] text-slate-500 leading-tight font-medium">{log.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-slate-50 pt-8">
            <button onClick={() => router.push('/master/logs')} className="w-full py-4 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-emerald-200 hover:text-emerald-700 transition-all">
              Comprehensive Log Stream
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
