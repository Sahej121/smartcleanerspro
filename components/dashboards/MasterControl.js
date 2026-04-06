'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
    if (num === 0) { setDisplay(0); return; }
    
    let start = 0;
    const startTime = performance.now();
    
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (num - start) * eased);
      setDisplay(current);
      if (progress < 1) ref.current = requestAnimationFrame(step);
    }
    
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);
  
  return <>{prefix}{display.toLocaleString('en-IN')}{suffix}</>;
}

export default function MasterControl({ user }) {
  const [masterStats, setMasterStats] = useState(null);
  const [stores, setStores] = useState([]);
  const [logs, setLogs] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStore, setNewStore] = useState({ store_name: '', city: '', admin_name: '', admin_email: '', admin_phone: '', subscription_tier: 'starter' });
  const [credentialsModal, setCredentialsModal] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // View State
  const router = useRouter();
  const [activeView, setActiveView] = useState('overview');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState('info');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, storesRes, logsRes, healthRes] = await Promise.all([
        fetch('/api/master-stats'),
        fetch('/api/stores'),
        fetch('/api/system/logs'),
        fetch('/api/system/health')
      ]);
      
      const [stats, storesData, logsData, healthData] = await Promise.all([
        statsRes.json(),
        storesRes.json(),
        logsRes.json(),
        healthRes.json()
      ]);

      setMasterStats(stats);
      setStores(Array.isArray(storesData) ? storesData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
      setHealth(healthData);
    } catch (error) {
      console.error('Failed to fetch master data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetch('/api/system/logs').then(r => r.json()).then(data => setLogs(data));
      fetch('/api/system/health').then(r => r.json()).then(data => setHealth(data));
    }, 15000);

    // Sync active view with URL
    const path = window.location.pathname;
    if (path.includes('/master/nodes')) setActiveView('nodes');
    else if (path.includes('/master/insights')) setActiveView('insights');
    else if (path.includes('/master/logs')) setActiveView('logs');
    else if (path.includes('/master/security')) setActiveView('security');
    else setActiveView('overview');

    return () => clearInterval(interval);
  }, [window.location.pathname]);

  const toggleStoreStatus = async (storeId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/stores/${storeId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStores(stores.map(s => s.id === storeId ? { ...s, status: newStatus } : s));
        fetch('/api/system/logs').then(r => r.json()).then(data => setLogs(data));
      }
    } catch (err) {
      console.error('Failed to toggle store status:', err);
    }
  };

  const handleCreateStore = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStore),
      });
      if (res.ok) {
        const data = await res.json();
        setShowCreateModal(false);
        setNewStore({ store_name: '', city: '', admin_name: '', admin_email: '', admin_phone: '', subscription_tier: 'starter' });
        setCredentialsModal({ storeName: data.store_name, email: data.admin_email, password: data.tempPassword });
        fetchData();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to provision store');
      }
    } catch (e) {
      console.error(e);
      setErrorMessage('An internal connection error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    setIsBroadcasting(true);
    try {
      const res = await fetch('/api/system/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMessage, severity: broadcastSeverity }),
      });
      if (res.ok) {
        setBroadcastMessage('');
        fetch('/api/system/logs').then(r => r.json()).then(data => setLogs(data));
      }
    } catch (err) {
      console.error('Broadcast failed:', err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'JUST NOW';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} MINS AGO`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} HOURS AGO`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Syncing Master Control...</p>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-fade-in-up">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline uppercase leading-none">Global Oversight</h1>
          <p className="text-on-surface-variant font-medium text-lg italic">Master Instance: {stores.length} Nodes Online</p>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 premium-gradient text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-900/10 active:scale-95 shimmer-btn transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Provision Node
          </button>
          <button 
            onClick={fetchData}
            className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-900/10 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">sync</span>
            Sync System
          </button>
        </div>
      </div>

      {/* Broadcast Bar */}
      <div className="bg-emerald-50/50 p-4 rounded-[2rem] border border-emerald-100/50 flex flex-col md:flex-row items-center gap-4 animate-fade-in-up">
         <div className="flex items-center gap-3 px-4">
            <span className="material-symbols-outlined text-emerald-600 animate-pulse">campaign</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 whitespace-nowrap">Global Broadcast</span>
         </div>
         <div className="flex-1 w-full flex gap-2">
            <select 
              value={broadcastSeverity}
              onChange={(e) => setBroadcastSeverity(e.target.value)}
              className="bg-white border-none rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
            >
               <option value="info">INFO</option>
               <option value="warning">WARNING</option>
               <option value="error">CRITICAL</option>
            </select>
            <input 
              type="text"
              placeholder="Announce system maintenance or updates to all nodes..."
              className="flex-1 bg-white border-none rounded-xl py-3 px-6 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none shadow-sm"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendBroadcast()}
            />
            <button 
              onClick={handleSendBroadcast}
              disabled={isBroadcasting || !broadcastMessage.trim()}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 transition-all shadow-lg"
            >
               {isBroadcasting ? 'Sending...' : 'Transmit'}
            </button>
         </div>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 bg-white rounded-3xl p-8 flex flex-col justify-between border border-slate-100 shadow-sm animate-fade-in-up relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Global Revenue</span>
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
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-60 -translate-y-16 translate-x-16"></div>
        </div>

        <div className="bg-white rounded-3xl p-8 flex flex-col justify-between border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all">
          <span className="material-symbols-outlined text-emerald-700 text-2xl mb-4 group-hover:scale-110 transition-transform">dns</span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Nodes</p>
            <h2 className="text-5xl font-black font-headline">{stores.length}</h2>
          </div>
        </div>

        <div className={`${health?.status === 'OPERATIONAL' ? 'bg-[#0e7432]' : 'bg-amber-700'} text-white rounded-3xl p-8 flex flex-col justify-between shadow-xl shadow-emerald-900/10`}>
          <span className="material-symbols-outlined text-white text-2xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>shield_heart</span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100 opacity-70">SLA Uptime</p>
            <h2 className="text-5xl font-black font-headline">{health?.uptime || '99.9%'}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
        <div className="col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-hidden">
            <h3 className="text-xl font-bold font-headline mb-6 border-b border-slate-50 pb-4">Recent Store Activity</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="text-[10px] uppercase font-black text-slate-400 border-b border-slate-50">
                    <th className="py-4 text-left">Node Identify</th>
                    <th className="py-4 text-left">Status</th>
                    <th className="py-4 text-right">Revenue</th>
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
                      <td className="py-5 text-right font-black text-sm">{formatCurrency(store.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => router.push('/master/nodes')} className="w-full mt-6 py-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all font-headline">
              Enter Cluster Management →
            </button>
          </div>
          
          <div className="bg-[#0b1c20] rounded-[2.5rem] p-8 relative overflow-hidden group">
             <div className="relative z-10">
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400/80 mb-6 flex items-center gap-2">
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
            Security Audit
          </h3>
          <div className="space-y-6 relative z-10">
            {logs.slice(0, 6).map((log) => (
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
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-40 translate-x-16 translate-y-16"></div>
        </div>
      </div>
    </div>
  );

  const renderNodes = () => (
    <div className="space-y-8 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
             <h1 className="text-4xl font-black font-headline uppercase leading-none">Manage Nodes</h1>
             <p className="text-slate-500 italic mt-2">Total of {stores.length} store instances provisioned.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="px-8 py-4 premium-gradient text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
             Provision New Cluster Instance
          </button>
       </div>
       
       <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[700px]">
             <thead>
                <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                   <th className="py-6 text-left">Identity</th>
                   <th className="py-6 text-left">Location Index</th>
                   <th className="py-6 text-left">Health Status</th>
                   <th className="py-6 text-right">Revenue Contrib</th>
                   <th className="py-6 text-right">Service Control</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {stores.map(store => (
                   <tr key={store.id} className="group hover:bg-slate-50 transition-all duration-300">
                      <td className="py-6">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs group-hover:bg-emerald-700 transition-colors">
                               {store.store_name.substring(0,2).toUpperCase()}
                            </div>
                            <span className="font-black text-sm text-on-surface">{store.store_name}</span>
                         </div>
                      </td>
                      <td className="py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">{store.city}</td>
                      <td className="py-6 flex flex-col items-start gap-1">
                         <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${store.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {store.status === 'active' ? 'Operational' : 'Suspended'}
                         </span>
                         <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-800 text-white shadow-sm">
                            {store.subscription_tier === 'pro' ? 'Pro' : store.subscription_tier === 'growth' ? 'Growth' : 'Starter'} Plan
                         </span>
                      </td>
                      <td className="py-6 text-right font-black text-sm text-on-surface">{formatCurrency(store.total_revenue)}</td>
                      <td className="py-6 text-right">
                         <button 
                           onClick={() => toggleStoreStatus(store.id, store.status)}
                           className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${store.status === 'active' ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                         >
                            {store.status === 'active' ? 'Suspend Access' : 'Restore Service'}
                         </button>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-8 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
             <h1 className="text-4xl font-black font-headline uppercase leading-none">System Insights</h1>
             <p className="text-slate-500 italic mt-2">Advanced global performance analytics.</p>
          </div>
          <div className="flex gap-2">
             <button className="px-6 py-3 bg-white border border-slate-100 rounded-xl font-black text-[10px] uppercase shadow-sm tracking-widest hover:bg-slate-50 transition-all">Export XML</button>
             <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase shadow-sm tracking-widest hover:scale-105 transition-all">Detailed PDF Dispatch</button>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Revenue Velocity (Global)</p>
                <h2 className="text-5xl font-black font-headline mb-8 text-on-surface">
                   <AnimatedCounter value={masterStats?.total_revenue || 0} prefix="$" />
                </h2>
                <div className="h-48 flex items-end gap-2">
                   {[0.2, 0.4, 0.35, 0.5, 0.45, 0.7, 0.65, 0.9, 0.8, 0.85, 0.95, 1.0].map((h, i) => (
                      <div key={i} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500 transition-all rounded-t-xl group relative" style={{ height: `${h * 100}%` }}>
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Q{Math.ceil((i+1)/3)} M{i+1}: {Math.floor(h * 40)}k
                         </div>
                      </div>
                   ))}
                </div>
                <div className="flex justify-between mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                   <span>Fiscal Year 2024</span>
                   <span>Projected Growth +18%</span>
                </div>
             </div>
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-40 translate-x-32 -translate-y-32"></div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
             <div className="relative z-10">
                <p className="text-[10px] font-black uppercase text-emerald-400/80 tracking-widest mb-2">Network Load Distribution</p>
                <h2 className="text-5xl font-black font-headline mb-8 italic tracking-tighter">84,290 req/min</h2>
                
                <div className="space-y-6">
                   {[
                      { label: 'Cluster Americas', val: 45, color: 'bg-emerald-500' },
                      { label: 'Cluster Europe', val: 28, color: 'bg-emerald-300' },
                      { label: 'Cluster Asia Pacific', val: 18, color: 'bg-emerald-700' },
                      { label: 'Edge Nodes (Isolated)', val: 9, color: 'bg-slate-700' },
                   ].map((r, i) => (
                      <div key={i}>
                         <div className="flex justify-between text-[10px] font-black uppercase mb-2 text-emerald-50/60 tracking-widest">
                            <span>{r.label}</span>
                            <span>{r.val}%</span>
                         </div>
                         <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full ${r.color} shadow-[0_0_10px_rgba(16,185,129,0.2)]`} style={{ width: `${r.val}%` }}></div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
             <div className="absolute bottom-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl opacity-30 translate-x-32 translate-y-32"></div>
          </div>
       </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-8 animate-fade-in flex flex-col h-[75vh]">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
             <h1 className="text-4xl font-black font-headline uppercase leading-none">Global Logs</h1>
             <p className="text-slate-500 italic mt-2">Real-time system event stream & archival.</p>
          </div>
          <div className="flex gap-4">
             <div className="relative w-72 group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                <input 
                  type="text" 
                  placeholder="Filter global event stream..." 
                  className="w-full bg-white border border-slate-100 rounded-2xl py-3.5 pl-12 pr-6 text-xs font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none shadow-sm transition-all"
                />
             </div>
             <button className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">Export Data Hub</button>
          </div>
       </div>

       <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50/50 px-10 py-5 border-b border-slate-100">
             <div className="grid grid-cols-12 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div className="col-span-2">Timestamp</div>
                <div className="col-span-2">Source / Type</div>
                <div className="col-span-6">Description Payload</div>
                <div className="col-span-2 text-right">Severity Index</div>
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

  const renderSecurity = () => (
    <div className="space-y-8 animate-fade-in font-sans">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
             <h1 className="text-4xl font-black font-headline uppercase leading-none italic tracking-tight">Security & Health</h1>
             <p className="text-slate-500 italic mt-2">Global infrastructure protection & multi-tenant isolation audit.</p>
          </div>
          <div className="flex items-center gap-4 px-8 py-4 bg-slate-950 rounded-[2rem] border border-emerald-500/20 shadow-2xl">
             <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Network Shield: Active</span>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden group">
                   <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8 font-headline">Service Resource Usage</h4>
                   <div className="space-y-8">
                      {[
                         { label: 'Multi-tenant DB Load', val: 32, icon: 'database' },
                         { label: 'Node CPU Aggregation', val: 45, icon: 'memory' },
                         { label: 'Socket Cluster Latency', val: 12, icon: 'lan' },
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
                               <div className="h-full bg-slate-900 group-hover:bg-emerald-600 transition-all duration-700" style={{ width: `${item.val}%`, transitionDelay: `${idx * 100}ms` }}></div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl border border-white/5 relative overflow-hidden">
                   <h4 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 mb-8 font-headline">Threat Intelligence</h4>
                   <div className="flex items-end gap-3 mb-8">
                      <span className="text-6xl font-black italic tracking-tighter leading-none">00</span>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 leading-tight">Critical Security<br/>Incidents Thwarted</p>
                   </div>
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Recent Lockdown Index</p>
                      <div className="flex gap-1 h-8 items-end">
                         {[...Array(12)].map((_, i) => (
                            <div key={i} className="flex-1 bg-emerald-500/20 rounded-t-[2px]" style={{ height: `${20 + Math.random() * 80}%` }}></div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm group">
                <div className="flex justify-between items-center mb-8">
                   <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 font-headline">Infrastructure Broadcast Dispatch</h4>
                   <span className="material-symbols-outlined text-red-500 animate-pulse text-xl">emergency_home</span>
                </div>
                <div className="flex gap-4 p-2 bg-slate-50 rounded-[2.2rem] border border-slate-100 ring-4 ring-transparent focus-within:ring-red-500/5 transition-all">
                   <input 
                     type="text" 
                     placeholder="Enter high-priority system alert for all cluster nodes..."
                     className="flex-1 bg-transparent border-none py-5 px-8 text-sm font-bold focus:ring-0 outline-none placeholder:text-slate-400"
                     value={broadcastMessage}
                     onChange={(e) => setBroadcastMessage(e.target.value)}
                   />
                   <button 
                     onClick={handleSendBroadcast}
                     disabled={isBroadcasting || !broadcastMessage.trim()}
                     className="px-10 py-5 bg-red-600 text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-900/10 active:scale-95 disabled:opacity-50 transition-all hover:bg-red-700"
                   >
                      {isBroadcasting ? 'Dispatching...' : 'Transmit Emergency'}
                   </button>
                </div>
             </div>
          </div>

          <div className="space-y-8">
             <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl relative overflow-hidden flex flex-col justify-between h-full">
                <div>
                   <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-10 font-headline">Global Health Index</h4>
                   <div className="space-y-12">
                      {[
                         { l: 'Auth Gateway', s: 'Operational', h: 99.99, c: 'bg-emerald-500' },
                         { l: 'Workflow Cluster', s: 'Operational', h: 100, c: 'bg-emerald-400' },
                         { l: 'Primary Postgres', s: 'Operational', h: 99.98, c: 'bg-emerald-600' },
                         { l: 'S3 Asset Pool', s: 'Notice', h: 98.4, c: 'bg-amber-500' },
                      ].map((x, i) => (
                         <div key={i} className="group cursor-default">
                            <div className="flex justify-between items-center mb-3">
                               <span className="text-[11px] font-black uppercase text-on-surface tracking-tighter group-hover:text-emerald-700 transition-colors">{x.l}</span>
                               <span className="text-[10px] font-black text-slate-900 italic">{x.h}%</span>
                            </div>
                            <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                               <div className={`h-full ${x.c} shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000`} style={{ width: `${x.h}%` }}></div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
                <div className="mt-12 pt-8 border-t border-slate-50">
                   <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.3em] leading-relaxed text-center italic">
                      Verified Infrastructure Status:<br/>
                      {new Date().toLocaleString()}
                   </p>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 min-h-screen">
      {/* Global Command Bar */}
      <div className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center gap-6 animate-fade-in-up">
        <div className="relative w-full max-w-2xl group cursor-pointer" onClick={() => router.push('/')}>
           <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 z-10 font-bold scale-125">terminal</span>
           <div className="w-full bg-white/40 backdrop-blur-md border border-emerald-100/30 rounded-[2.5rem] py-5 pl-16 pr-8 text-sm font-black text-slate-300 shadow-xl shadow-slate-200/50 relative z-10 select-none flex items-center gap-1.5 overflow-hidden">
              <span className="animate-pulse">_</span>
              Execute global command cluster search...
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-1.5">
                 <kbd className="px-2.5 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-400 border border-slate-200 shadow-sm uppercase tracking-tighter">Ctrl</kbd>
                 <kbd className="px-2.5 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-400 border border-slate-200 shadow-sm uppercase tracking-tighter">K</kbd>
              </div>
           </div>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Identity Protocol</p>
              <p className="text-sm font-black text-slate-900 tracking-tight">Root Admin: Sahej</p>
           </div>
           <button onClick={() => router.push('/')} className="w-12 h-12 rounded-[1.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-center text-slate-400 hover:text-emerald-700 hover:scale-110 active:scale-90 transition-all">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
           </button>
        </div>
      </div>
      
      {/* View Dispatcher */}
      <div className="relative pt-4 overflow-hidden min-h-[80vh]">
         {activeView === 'overview' && renderOverview()}
         {activeView === 'nodes' && renderNodes()}
         {activeView === 'insights' && renderInsights()}
         {activeView === 'logs' && renderLogs()}
         {activeView === 'security' && renderSecurity()}
      </div>

      {/* Global Modals for Master Control */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xl animate-fade-in">
           <div className="bg-white rounded-[3rem] w-full max-w-xl p-6 lg:p-12 shadow-2xl relative animate-fade-in-up border border-white max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 -translate-y-20 translate-x-20"></div>
              
              <div className="relative z-10">
                 <h2 className="text-4xl font-black font-headline uppercase italic leading-none mb-2">Provision Cluster</h2>
                 <p className="text-slate-500 font-medium italic mb-10 text-lg">Deploying a new multi-tenant node to CleanFlow network.</p>
                 
                 <div className="space-y-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Node Identify Name</label>
                       <input 
                         type="text" 
                         placeholder="e.g. London flagship Cluster" 
                         className="w-full bg-slate-50 border-none rounded-[1.8rem] py-5 px-8 text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                         value={newStore.store_name}
                         onChange={(e) => setNewStore({...newStore, store_name: e.target.value})}
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Geo-Location Index</label>
                          <input 
                            type="text" 
                            placeholder="e.g. London, UK" 
                            className="w-full bg-slate-50 border-none rounded-[1.8rem] py-5 px-8 text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                            value={newStore.city}
                            onChange={(e) => setNewStore({...newStore, city: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Subscription Tier</label>
                          <select 
                            className="w-full bg-slate-50 border-none rounded-[1.8rem] py-5 px-8 text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none appearance-none cursor-pointer"
                            value={newStore.subscription_tier}
                            onChange={(e) => setNewStore({...newStore, subscription_tier: e.target.value})}
                          >
                            <option value="starter">Starter Plan (₹999/mo)</option>
                            <option value="growth">Growth Plan (₹1,999/mo)</option>
                            <option value="pro">Pro Plan (₹3,500/mo)</option>
                          </select>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Admin Entity</label>
                          <input 
                            type="text" 
                            placeholder="Full Name" 
                            className="w-full bg-slate-50 border-none rounded-[1.8rem] py-5 px-8 text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                            value={newStore.admin_name}
                            onChange={(e) => setNewStore({...newStore, admin_name: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Contact Protocol</label>
                          <input 
                            type="email" 
                            placeholder="Email Address" 
                            className="w-full bg-slate-50 border-none rounded-[1.8rem] py-5 px-8 text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                            value={newStore.admin_email}
                            onChange={(e) => setNewStore({...newStore, admin_email: e.target.value})}
                          />
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-4 mt-12">
                    <button 
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 py-5 rounded-[1.8rem] bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
                    >
                       Abort Dispatch
                    </button>
                    <button 
                      onClick={handleCreateStore}
                      disabled={isCreating}
                      className="flex-[2] py-5 rounded-[1.8rem] bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all hover:bg-emerald-700 flex items-center justify-center gap-3"
                    >
                       {isCreating ? (
                         <>
                           <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                           Syncing Nexus...
                         </>
                       ) : 'Execute Deployment'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Global Error Modal */}
      {errorMessage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl border border-red-100 animate-fade-in-up">
            <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center text-red-600 mx-auto mb-8 shadow-inner">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            </div>
            <h3 className="text-xl font-black text-center text-slate-900 mb-2 uppercase tracking-tighter">System Alert</h3>
            <p className="text-slate-500 text-center font-medium italic mb-10 leading-relaxed text-sm">{errorMessage}</p>
            <button 
              onClick={() => setErrorMessage(null)}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
            >
              Acknowledge Alert
            </button>
          </div>
        </div>
      )}

      {/* Store Credentials Modal */}
      {credentialsModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-6 lg:p-12 shadow-2xl animate-fade-in-up border-4 border-emerald-500/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-60"></div>
             
             <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl rotate-3">
                   <span className="material-symbols-outlined text-4xl">cloud_done</span>
                </div>
                <h2 className="text-3xl font-black font-headline uppercase italic text-on-surface leading-none mb-2">Nexus Linked</h2>
                <p className="text-slate-500 font-medium italic mb-10">Credentials generated for <strong>{credentialsModal.storeName}</strong>.</p>
                
                <div className="bg-slate-50 p-8 rounded-3xl space-y-6 text-left border border-slate-100 mb-10 shadow-inner">
                   <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Admin Identity</p>
                      <p className="text-sm font-black text-slate-900 break-all">{credentialsModal.email}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Access Key (PIN)</p>
                      <p className="text-4xl font-headline font-black text-emerald-700 tracking-[0.5em]">{credentialsModal.password}</p>
                   </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-2xl flex gap-3 text-left mb-10">
                   <span className="material-symbols-outlined text-amber-600">warning</span>
                   <p className="text-[10px] font-bold text-amber-800 leading-relaxed italic uppercase">Transmit these credentials securely. Keys will be encrypted upon first synchronization.</p>
                </div>

                <button 
                  onClick={() => setCredentialsModal(null)}
                  className="w-full py-5 premium-gradient text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/10 active:scale-95 transition-all"
                >
                   Finalize Dispatch
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
