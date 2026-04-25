'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/currency-utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { AnimatedCounter } from '@/components/common/AnimatedStats';
import MasterOverview from './master/MasterOverview';
import MasterNodes from './master/MasterNodes';
import MasterInsights from './master/MasterInsights';
import MasterLogs from './master/MasterLogs';
import MasterSecurity from './master/MasterSecurity';

export default function MasterControl({ user }) {
  const { t } = useLanguage();
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
      fetch('/api/system/logs').then(r => r.json()).then(data => setLogs(Array.isArray(data) ? data : []));
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
        fetch('/api/system/logs').then(r => r.json()).then(data => setLogs(Array.isArray(data) ? data : []));
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
        fetch('/api/system/logs').then(r => r.json()).then(data => setLogs(Array.isArray(data) ? data : []));
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
    if (seconds < 60) return t('just_now');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} ${t('mins_ago')}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${t('hours_ago')}`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">{t('syncing_master_control')}</p>
      </div>
    );
  }

  const renderOverview = () => (
    <MasterOverview 
      user={user}
      owners={owners}
      stores={stores}
      masterStats={masterStats}
      health={health}
      logs={logs}
      t={t}
      router={router}
      fetchData={fetchData}
      setShowCreateModal={setShowCreateModal}
      broadcastSeverity={broadcastSeverity}
      setBroadcastSeverity={setBroadcastSeverity}
      broadcastMessage={broadcastMessage}
      setBroadcastMessage={setBroadcastMessage}
      handleSendBroadcast={handleSendBroadcast}
      isBroadcasting={isBroadcasting}
    />
  );

  const renderNodes = () => (
    <MasterNodes 
      user={user}
      owners={owners}
      stores={stores}
      t={t}
      expandedOwners={expandedOwners}
      toggleOwnerExpansion={toggleOwnerExpansion}
      handleUpdateTier={handleUpdateTier}
      setProvisionMode={setProvisionMode}
      setShowCreateModal={setShowCreateModal}
      setNewStore={setNewStore}
      newStore={newStore}
      toggleStoreStatus={toggleStoreStatus}
      setDeleteStoreModal={setDeleteStoreModal}
    />
  );

  const renderInsights = () => (
    <MasterInsights 
      masterStats={masterStats}
      t={t}
    />
  );

  const renderLogs = () => (
    <MasterLogs 
      logs={logs}
      t={t}
    />
  );

  const renderSecurity = () => (
    <MasterSecurity 
      t={t}
      broadcastMessage={broadcastMessage}
      setBroadcastMessage={setBroadcastMessage}
      handleSendBroadcast={handleSendBroadcast}
      isBroadcasting={isBroadcasting}
    />
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
              <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.2em] mb-0.5">{t('identity_protocol')}</p>
              <p className="text-sm font-black text-on-surface tracking-tight">{t('root_admin')}</p>
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
                 <h2 className="text-4xl font-black font-headline uppercase italic leading-none mb-2">{t('provision_node')}</h2>
                 <p className="text-slate-500 font-medium italic mb-8 text-lg">{t('deploying_new_node')}</p>

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
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 ml-4">{t('select_existing_owner')}</label>
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
                            <option value="">{t('choose_owner')}</option>
                            {owners.map(o => (
                               <option key={o.owner_id} value={o.owner_id}>{o.name} ({o.email})</option>
                            ))}
                          </select>
                       </div>
                    )}

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">{t('node_identity_name')}</label>
                       <input 
                         type="text" 
                         placeholder={t('node_name_placeholder')} 
                         className="w-full bg-slate-50 border-none rounded-[1.8rem] py-5 px-8 text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                         value={newStore.store_name}
                         onChange={(e) => setNewStore({...newStore, store_name: e.target.value})}
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">{t('geo_location_index')}</label>
                          <input 
                            type="text" 
                            placeholder="e.g. London, UK" 
                            className="w-full bg-slate-50 border-none rounded-[1.8rem] py-5 px-8 text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                            value={newStore.city}
                            onChange={(e) => setNewStore({...newStore, city: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">{t('subscription_tier')}</label>
                          <select 
                            className="w-full bg-slate-50 border-none rounded-[1.8rem] py-5 px-8 text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none appearance-none cursor-pointer"
                            value={newStore.subscription_tier}
                            onChange={(e) => setNewStore({...newStore, subscription_tier: e.target.value})}
                            disabled={provisionMode === 'existing'} 
                          >
                            <option value="software_only">{`${t('software_only')} (£25/mo)`}</option>
                            <option value="hardware_bundle">{`${t('hardware_bundle')} (£35/mo)`}</option>
                            <option value="enterprise">{`${t('enterprise')} (£99/mo)`}</option>
                          </select>
                       </div>
                    </div>
                    
                    {provisionMode === 'new' && (
                       <div className="grid grid-cols-2 gap-6 animate-fade-in">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">{t('admin_entity')}</label>
                             <input 
                               type="text" 
                               placeholder="Full Name" 
                               className="w-full bg-slate-50 border-none rounded-[1.8rem] py-5 px-8 text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                               value={newStore.admin_name}
                               onChange={(e) => setNewStore({...newStore, admin_name: e.target.value})}
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">{t('contact_protocol')}</label>
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
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">{t('manager_name')}</label>
                          <input 
                            type="text" 
                            placeholder="Full Name" 
                            className="w-full bg-white border-none rounded-[1.8rem] py-5 px-8 text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                            value={newStore.manager_name}
                            onChange={(e) => setNewStore({...newStore, manager_name: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">{t('manager_email')}</label>
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
                       ) : t('execute_deployment')}
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
            <h3 className="text-xl font-black text-center text-slate-900 mb-2 uppercase tracking-tighter">{t('system_alert')}</h3>
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
                <h2 className="text-3xl font-black font-headline uppercase italic text-on-surface leading-none mb-2">{t('nexus_linked')}</h2>
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
                          {credentialsModal.password}
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
                  <h3 className="text-xl font-black font-headline uppercase tracking-tighter">{t('node_termination')}</h3>
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
                    <button onClick={() => setDeleteStoreModal({ ...deleteStoreModal, step: 3 })} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/10 active:scale-95 transition-all">{t('confirm_irreversible')}</button>
                    <button onClick={() => setDeleteStoreModal({ ...deleteStoreModal, step: 1 })} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">Go Back</button>
                  </div>
                </div>
              )}

              {deleteStoreModal.step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">{t('final_confirmation_protocol')}</label>
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
                      ) : t('execute_node_termination')}
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
