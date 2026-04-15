'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/currency-utils';

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
  const [owners, setOwners] = useState([]); // Hierarchical data for SuperAdmin
  const [stores, setStores] = useState([]); // Flat data for non-SuperAdmin
  const [logs, setLogs] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [provisionMode, setProvisionMode] = useState('new'); // 'new' or 'existing'
  const [newStore, setNewStore] = useState({ 
    store_name: '', 
    city: '', 
    admin_name: '', 
    admin_email: '', 
    admin_phone: '', 
    subscription_tier: 'software_only',
    owner_id: '',
    manager_name: '',
    manager_email: ''
  });
  const [credentialsModal, setCredentialsModal] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [expandedOwners, setExpandedOwners] = useState(new Set());
  
  // View State
  const router = useRouter();
  const [activeView, setActiveView] = useState('overview');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState('info');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [deleteStoreModal, setDeleteStoreModal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, storesRes, logsRes, healthRes] = await Promise.all([
        fetch('/api/master-stats'),
        fetch('/api/stores?hierarchical=true'),
        fetch('/api/system/logs'),
        fetch('/api/system/health')
      ]);
      
      const stats = statsRes.ok ? await statsRes.json() : {};
      const storesData = storesRes.ok ? await storesRes.json() : [];
      const logsData = logsRes.ok ? await logsRes.json() : [];
      const healthData = healthRes.ok ? await healthRes.json() : {};

      setMasterStats(stats);
      if (user?.id == 1) {
        setOwners(Array.isArray(storesData) ? storesData : []);
      } else {
        setStores(Array.isArray(storesData) ? storesData : []);
      }
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

  const toggleOwnerExpansion = (ownerId) => {
    const next = new Set(expandedOwners);
    if (next.has(ownerId)) next.delete(ownerId);
    else next.add(ownerId);
    setExpandedOwners(next);
  };

  const handleUpdateTier = async (ownerId, newTier) => {
    // Current schema stores tier on EACH store. 
    // We update all stores for this owner.
    const owner = owners.find(o => o.owner_id === ownerId);
    if (!owner) return;

    try {
      const promises = owner.stores.map(store => 
        fetch(`/api/stores/${store.id}/tier`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: newTier }),
        })
      );
      
      const results = await Promise.all(promises);
      if (results.every(r => r.ok)) {
        fetchData();
      } else {
        setErrorMessage('Failed to update some node tiers across the cluster.');
      }
    } catch (err) {
      console.error('Tier update failure:', err);
      setErrorMessage('Network error during cluster-wide tier reconfiguration.');
    }
  };

  const toggleStoreStatus = async (storeId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/stores/${storeId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        if (user?.id == 1) {
          fetchData(); // Refresh hierarchical data
        } else {
          setStores(stores.map(s => s.id === storeId ? { ...s, status: newStatus } : s));
        }
        fetch('/api/system/logs').then(r => r.json()).then(data => setLogs(data));
      }
    } catch (err) {
      console.error('Failed to toggle store status:', err);
    }
  };

  const handleCreateStore = async () => {
    setIsCreating(true);
    try {
      // If existing owner mode, ensure owner_id is set
      const payload = { ...newStore };
      if (provisionMode === 'existing') {
        if (!newStore.owner_id) {
          setErrorMessage('Please select an existing business owner.');
          return;
        }
        if (!newStore.manager_name || !newStore.manager_email) {
          setErrorMessage('Manager details are required for provisioning a new node to an existing business.');
          return;
        }
        payload.admin_name = ''; 
        payload.admin_email = '';
      } else {
        if (!newStore.admin_name || !newStore.admin_email) {
          setErrorMessage('Owner name and email are required for new business provisioning.');
          return;
        }
        payload.owner_id = '';
      }

      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setShowCreateModal(false);
        setNewStore({ store_name: '', city: '', admin_name: '', admin_email: '', admin_phone: '', subscription_tier: 'software_only', owner_id: '', manager_name: '', manager_email: '' });
        setCredentialsModal({ 
          storeName: data.store_name, 
          email: data.manager?.email || data.admin_email, 
          password: data.manager?.tempPassword || data.tempPassword, 
          pin: data.manager?.tempPin || data.tempPin,
          isManager: !!data.manager
        });
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

  const handleDeleteStore = async () => {
    if (!deleteStoreModal) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/stores/${deleteStoreModal.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteStoreModal(null);
        setErrorMessage(null);
        fetchData();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to delete store node');
        setDeleteStoreModal(null);
      }
    } catch (e) {
      setErrorMessage('Network error during node termination');
      setDeleteStoreModal(null);
    }
    setIsDeleting(false);
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

  const renderOverview = () => {
    const totalStores = user?.id == 1 ? owners.reduce((acc, o) => acc + (o.stores?.length || 0), 0) : stores.length;
    
    return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-fade-in-up">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline uppercase leading-none">Global Oversight</h1>
          <p className="text-on-surface-variant font-medium text-lg italic">Master Instance: {totalStores} Nodes Online</p>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 premium-gradient text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-900/10 active:scale-95 transition-all flex items-center justify-center gap-2"
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
              className="px-8 py-3 bg-theme-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 transition-all shadow-lg"
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
        </div>

        <div className="bg-white rounded-3xl p-8 flex flex-col justify-between border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all">
          <span className="material-symbols-outlined text-emerald-700 text-2xl mb-4 group-hover:scale-110 transition-transform">dns</span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Nodes</p>
            <h2 className="text-5xl font-black font-headline">{stores.length}</h2>
          </div>
        </div>

        <div className={`${health?.status === 'OPERATIONAL' ? 'bg-primary' : 'bg-amber-700'} text-white rounded-3xl p-8 flex flex-col justify-between shadow-xl shadow-emerald-900/10`}>
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
                      <td className="py-5 text-right font-black text-sm">{formatCurrency(store.total_revenue, store.country || 'United Kingdom')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => router.push('/master/nodes')} className="w-full mt-6 py-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all font-headline">
              Enter Cluster Management →
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
        </div>
      </div>
    </div>
    );
  };

  const renderNodes = () => {
    const totalStores = user?.id == 1 ? owners.reduce((acc, o) => acc + (o.stores?.length || 0), 0) : stores.length;

    return (
    <div className="space-y-8 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
             <h1 className="text-4xl font-black font-headline uppercase leading-none">Manage Nodes</h1>
             <p className="text-slate-500 italic mt-2">Total of {totalStores} store instances provisioned.</p>
          </div>
          <button onClick={() => {
            setProvisionMode('new');
            setShowCreateModal(true);
          }} className="px-8 py-4 premium-gradient text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
             Provision New Cluster Instance
          </button>
       </div>
       
       <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-x-auto">
          {user?.id == 1 ? (
             <table className="w-full min-w-[700px]">
                <thead>
                   <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                      <th className="py-6 text-left">Business Owner</th>
                      <th className="py-6 text-left">Tier Access</th>
                      <th className="py-6 text-center">Nodes</th>
                      <th className="py-6 text-right">Revenue Contrib</th>
                      <th className="py-6 text-right">Management Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {owners.map(owner => (
                      <React.Fragment key={owner.owner_id}>
                        <tr 
                          className={`group cursor-pointer hover:bg-slate-50/80 transition-all duration-300 ${expandedOwners.has(owner.owner_id) ? 'bg-slate-50/50' : ''}`}
                          onClick={() => toggleOwnerExpansion(owner.owner_id)}
                        >
                           <td className="py-8">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform">
                                    {owner.name.substring(0,2).toUpperCase()}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="font-black text-sm text-on-surface">{owner.name}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{owner.email}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="py-8" onClick={(e) => e.stopPropagation()}>
                              <select 
                                value={owner.tier || ""}
                                onChange={(e) => handleUpdateTier(owner.owner_id, e.target.value)}
                                className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border-none focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer hover:bg-emerald-100 transition-all"
                              >
                                 <option value="software_only">Software Only</option>
                                 <option value="hardware_bundle">Hardware Bundle</option>
                                 <option value="enterprise">Enterprise</option>
                              </select>
                           </td>
                           <td className="py-8 text-center">
                              <span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 font-black text-xs">
                                 {owner.stores?.length || 0}
                              </span>
                           </td>
                           <td className="py-8 text-right font-black text-sm text-on-surface">
                              {formatCurrency(owner.total_revenue, 'United Kingdom')}
                           </td>
                           <td className="py-8 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-3">
                                 <button 
                                   onClick={() => {
                                      setProvisionMode('existing');
                                      setNewStore({ ...newStore, owner_id: owner.owner_id, subscription_tier: owner.tier || 'software_only' });
                                      setShowCreateModal(true);
                                   }}
                                   className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all flex items-center gap-2"
                                 >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    Add Node
                                 </button>
                                 <span className={`material-symbols-outlined text-slate-300 transition-transform duration-300 ${expandedOwners.has(owner.owner_id) ? 'rotate-180' : ''}`}>
                                    keyboard_arrow_down
                                 </span>
                              </div>
                           </td>
                        </tr>
                        {expandedOwners.has(owner.owner_id) && (
                           <tr>
                              <td colSpan="5" className="px-8 pb-8 pt-0 bg-slate-50/30">
                                 <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in-down">
                                    <table className="w-full">
                                       <thead className="bg-slate-50/50">
                                          <tr className="text-[9px] font-black uppercase text-slate-400 border-b border-slate-100">
                                             <th className="py-4 px-6 text-left">Node ID</th>
                                             <th className="py-4 px-6 text-left">Location</th>
                                             <th className="py-4 px-6 text-left">Status</th>
                                             <th className="py-4 px-6 text-right">Revenue</th>
                                             <th className="py-4 px-6 text-right">Actions</th>
                                          </tr>
                                       </thead>
                                       <tbody className="divide-y divide-slate-50">
                                          {owner.stores.map(store => (
                                             <tr key={store.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-6 font-bold text-xs text-on-surface">{store.store_name}</td>
                                                <td className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{store.city}</td>
                                                <td className="py-4 px-6">
                                                   <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${store.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                                      {store.status}
                                                   </span>
                                                </td>
                                                <td className="py-4 px-6 text-right font-black text-xs text-on-surface">{formatCurrency(store.total_revenue, store.country || 'United Kingdom')}</td>
                                                <td className="py-4 px-6 text-right">
                                                   <div className="flex items-center justify-end gap-2">
                                                      <button 
                                                        onClick={() => toggleStoreStatus(store.id, store.status)}
                                                        className={`text-[9px] font-black uppercase tracking-widest ${store.status === 'active' ? 'text-red-500' : 'text-emerald-600'}`}
                                                      >
                                                         {store.status === 'active' ? 'Suspend' : 'Restrat'}
                                                      </button>
                                                      <button 
                                                        onClick={() => setDeleteStoreModal({ id: store.id, name: store.store_name, step: 1, confirmText: '' })}
                                                        className="text-red-600 animate-pulse"
                                                      >
                                                         <span className="material-symbols-outlined text-sm">delete</span>
                                                      </button>
                                                   </div>
                                                </td>
                                             </tr>
                                          ))}
                                          {owner.stores.length === 0 && (
                                             <tr>
                                                <td colSpan="5" className="py-8 text-center text-slate-400 font-bold text-xs italic">
                                                   No nodes currently provisioned for this cluster.
                                                </td>
                                             </tr>
                                          )}
                                       </tbody>
                                    </table>
                                 </div>
                              </td>
                           </tr>
                        )}
                      </React.Fragment>
                   ))}
                </tbody>
             </table>
          ) : (
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
                               <div className="w-10 h-10 rounded-xl bg-theme-accent text-white flex items-center justify-center font-black text-xs group-hover:bg-emerald-700 transition-colors">
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
                         </td>
                         <td className="py-6 text-right font-black text-sm text-on-surface">{formatCurrency(store.total_revenue, store.country || 'United Kingdom')}</td>
                         <td className="py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => toggleStoreStatus(store.id, store.status)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${store.status === 'active' ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                              >
                                 {store.status === 'active' ? 'Suspend Access' : 'Restore Service'}
                              </button>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          )}
       </div>
    </div>
  );
};

  const renderInsights = () => (
    <div className="space-y-8 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
             <h1 className="text-4xl font-black font-headline uppercase leading-none">System Insights</h1>
             <p className="text-slate-500 italic mt-2">Advanced global performance analytics.</p>
          </div>
          <div className="flex gap-2">
             <button className="px-6 py-3 bg-white border border-slate-100 rounded-xl font-black text-[10px] uppercase shadow-sm tracking-widest hover:bg-slate-50 transition-all">Export XML</button>
             <button className="px-6 py-3 bg-theme-accent text-white rounded-xl font-black text-[10px] uppercase shadow-sm tracking-widest hover:scale-105 transition-all">Detailed PDF Dispatch</button>
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
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-theme-text text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
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
          </div>

          <div className="bg-theme-surface-container rounded-[2.5rem] p-10 relative overflow-hidden shadow-sm border border-theme-border">
             <div className="relative z-10">
                <p className="text-[10px] font-black uppercase text-primary/80 tracking-widest mb-2">Network Load Distribution</p>
                <h2 className="text-5xl font-black font-headline mb-8 italic tracking-tighter text-on-surface">84,290 req/min</h2>
                
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
             <button className="px-8 py-3 bg-theme-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">Export Data Hub</button>
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
          <div className="flex items-center gap-4 px-8 py-4 bg-theme-surface-container rounded-[2rem] border border-primary/20 shadow-sm">
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
                               <div className="h-full bg-primary group-hover:bg-emerald-600 transition-all duration-700" style={{ width: `${item.val}%`, transitionDelay: `${idx * 100}ms` }}></div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="bg-theme-surface-container rounded-[2.5rem] p-10 shadow-sm border border-theme-border relative overflow-hidden">
                   <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-8 font-headline">Threat Intelligence</h4>
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
              <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.2em] mb-0.5">Identity Protocol</p>
              <p className="text-sm font-black text-on-surface tracking-tight">Root Admin: Sahej</p>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl animate-fade-in">
           <div className="bg-white rounded-[3rem] w-full max-w-2xl p-6 lg:p-12 shadow-2xl relative animate-fade-in-up border border-white max-h-[90vh] overflow-y-auto no-scrollbar">
              
              <div className="relative z-10">
                 <h2 className="text-4xl font-black font-headline uppercase italic leading-none mb-2">Provision Node</h2>
                 <p className="text-slate-500 font-medium italic mb-8 text-lg">Deploying a new multi-tenant node to DrycleanersFlow network.</p>

                 {/* Mode Selector */}
                 <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl mb-8">
                    <button 
                      onClick={() => setProvisionMode('new')}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${provisionMode === 'new' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      New Business
                    </button>
                    <button 
                      onClick={() => setProvisionMode('existing')}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${provisionMode === 'existing' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Existing Business
                    </button>
                 </div>
                 
                 <div className="space-y-8">
                    {provisionMode === 'existing' && (
                       <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100/50 space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 ml-4">Select Existing Owner</label>
                          <select 
                            className="w-full bg-white border-none rounded-[1.8rem] py-5 px-8 text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none appearance-none cursor-pointer"
                            value={newStore.owner_id}
                            onChange={(e) => {
                              const owner = owners.find(o => o.owner_id == e.target.value);
                              setNewStore({
                                ...newStore, 
                                owner_id: e.target.value,
                                subscription_tier: owner?.tier || 'software_only'
                              });
                            }}
                          >
                            <option value="">-- Choose Owner --</option>
                            {owners.map(o => (
                               <option key={o.owner_id} value={o.owner_id}>{o.name} ({o.email})</option>
                            ))}
                          </select>
                       </div>
                    )}

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
                            disabled={provisionMode === 'existing'} 
                          >
                            <option value="software_only">Software Only (£25/mo)</option>
                            <option value="hardware_bundle">Hardware Bundle (£35/mo)</option>
                            <option value="enterprise">Enterprise (£99/mo)</option>
                          </select>
                       </div>
                    </div>
                    
                    {provisionMode === 'new' && (
                       <div className="grid grid-cols-2 gap-6 animate-fade-in">
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
                    )}
                    
                    {/* Manager Info (Optional for new, but encouraged for existing) */}
                    <div className="grid grid-cols-2 gap-6 animate-fade-in shadow-sm bg-slate-50/30 p-4 rounded-3xl border border-slate-100">
                       <div className={`col-span-2 text-[10px] font-black uppercase tracking-[0.2em] mb-1 ml-4 italic ${provisionMode === 'existing' ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {provisionMode === 'existing' ? 'Provision Local Store Manager (Required)' : 'Local Manager (Optional override)'}
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Manager Name</label>
                          <input 
                            type="text" 
                            placeholder="Full Name" 
                            className="w-full bg-white border-none rounded-[1.8rem] py-5 px-8 text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                            value={newStore.manager_name}
                            onChange={(e) => setNewStore({...newStore, manager_name: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Manager Email</label>
                          <input 
                            type="email" 
                            placeholder="manager@branch.com" 
                            className="w-full bg-white border-none rounded-[1.8rem] py-5 px-8 text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                            value={newStore.manager_email}
                            onChange={(e) => setNewStore({...newStore, manager_email: e.target.value})}
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
                      className="flex-[2] py-5 rounded-[1.8rem] bg-theme-accent text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all hover:bg-emerald-700 flex items-center justify-center gap-3"
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl border border-red-100 animate-fade-in-up">
            <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center text-red-600 mx-auto mb-8 shadow-inner">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            </div>
            <h3 className="text-xl font-black text-center text-slate-900 mb-2 uppercase tracking-tighter">System Alert</h3>
            <p className="text-slate-500 text-center font-medium italic mb-10 leading-relaxed text-sm">{errorMessage}</p>
            <button 
              onClick={() => setErrorMessage(null)}
              className="w-full py-5 bg-theme-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
            >
              Acknowledge Alert
            </button>
          </div>
        </div>
      )}

      {/* Store Credentials Modal */}
      {credentialsModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-6 lg:p-12 shadow-2xl animate-fade-in-up border-4 border-emerald-500/20 relative overflow-hidden">
             
             <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl rotate-3">
                   <span className="material-symbols-outlined text-4xl">cloud_done</span>
                </div>
                <h2 className="text-3xl font-black font-headline uppercase italic text-on-surface leading-none mb-2">Nexus Linked</h2>
                <p className="text-slate-500 font-medium italic mb-10">
                  {credentialsModal.isManager ? 'Manager credentials' : 'Root Owner credentials'} generated for <strong>{credentialsModal.storeName}</strong>.
                </p>
                
                {(credentialsModal.password || credentialsModal.pin) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-emerald-200 transition-all">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                          {credentialsModal.isManager ? 'Manager Password' : 'Store Admin Password'}
                       </p>
                       <p className="text-sm font-black text-on-surface font-mono select-all">
                          {credentialsModal.password || 'EXISTING_AUTH'}
                       </p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 group hover:border-emerald-400 transition-all">
                       <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Floor Access PIN</p>
                       <p className="text-xl font-black text-emerald-900 font-mono tracking-widest select-all">
                          {credentialsModal.pin || '####'}
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
                  onClick={() => setCredentialsModal(null)}
                  className="w-full py-5 premium-gradient text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/10 active:scale-95 transition-all"
                >
                   Finalize Dispatch
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Delete Store Modal (3-Step Confirmation) */}
      {deleteStoreModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-red-100 overflow-hidden animate-fade-in-up">
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4 text-red-600">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                </div>
                <div>
                  <h3 className="text-xl font-black font-headline uppercase tracking-tighter">Node Termination</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Step {deleteStoreModal.step} of 3</p>
                </div>
              </div>

              {deleteStoreModal.step === 1 && (
                <div className="space-y-4">
                  <p className="text-slate-600 font-medium leading-relaxed">
                    You are about to permanently terminate node <span className="font-black text-red-600 underline">"{deleteStoreModal.name}"</span>. 
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
                    <button onClick={() => setDeleteStoreModal({ ...deleteStoreModal, step: 2 })} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/10 active:scale-95 transition-all">Proceed to Verification</button>
                    <button onClick={() => setDeleteStoreModal(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">Abort</button>
                  </div>
                </div>
              )}

              {deleteStoreModal.step === 2 && (
                <div className="space-y-6">
                  <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100">
                     <p className="text-sm font-bold text-amber-800 leading-relaxed">
                       I understand that this action is <span className="underline italic font-black">irreversible</span> and no backup can restore this node's data once the termination is finalized.
                     </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setDeleteStoreModal({ ...deleteStoreModal, step: 3 })} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/10 active:scale-95 transition-all">Confirm Irreversible Action</button>
                    <button onClick={() => setDeleteStoreModal({ ...deleteStoreModal, step: 1 })} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">Go Back</button>
                  </div>
                </div>
              )}

              {deleteStoreModal.step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Final Confirmation Protocol</label>
                    <p className="text-xs font-bold text-slate-500 mb-2">Type <span className="bg-slate-100 px-1.5 py-0.5 rounded text-red-600 font-mono">DELETE {deleteStoreModal.name}</span> to finalize node termination.</p>
                    <input 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none text-red-600 transition-all font-mono"
                      placeholder={`DELETE ${deleteStoreModal.name}`}
                      value={deleteStoreModal.confirmText}
                      onChange={e => setDeleteStoreModal({ ...deleteStoreModal, confirmText: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={handleDeleteStore}
                      disabled={deleteStoreModal.confirmText !== `DELETE ${deleteStoreModal.name}` || isDeleting}
                      className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/10 active:scale-95 transition-all disabled:opacity-40 disabled:grayscale"
                    >
                      {isDeleting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                          Terminating Node...
                        </span>
                      ) : 'Execute Node Termination'}
                    </button>
                    <button onClick={() => setDeleteStoreModal(null)} className="py-4 px-8 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">Abort</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
