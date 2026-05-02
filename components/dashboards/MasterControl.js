'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useMasterData } from './master/hooks/useMasterData';

// Views
import MasterOverview from './master/MasterOverview';
import MasterNodes from './master/MasterNodes';
import MasterInsights from './master/MasterInsights';
import MasterLogs from './master/MasterLogs';
import MasterSecurity from './master/MasterSecurity';

// Modals
import ProvisionNodeModal from './master/modals/ProvisionNodeModal';
import CredentialsModal from './master/modals/CredentialsModal';
import DeleteStoreModal from './master/modals/DeleteStoreModal';

export default function MasterControl({ user }) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  
  // Custom hook for data orchestration
  const {
    masterStats, owners, stores, logs, health, loading,
    fetchData, setOwners, setStores, setLogs
  } = useMasterData(user);

  // Local UI State
  // Derive active view from URL
  const getViewFromPath = (path) => {
    if (!path) return 'overview';
    if (path.includes('/master/nodes')) return 'nodes';
    if (path.includes('/master/insights')) return 'insights';
    if (path.includes('/master/logs')) return 'logs';
    if (path.includes('/master/security')) return 'security';
    return 'overview';
  };

  const activeView = getViewFromPath(pathname);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [provisionMode, setProvisionMode] = useState('new');
  const [newStore, setNewStore] = useState({ 
    store_name: '', city: '', admin_name: '', admin_email: '', admin_phone: '', 
    subscription_tier: 'software_only', owner_id: '', manager_name: '', manager_email: '' 
  });
  const [credentialsModal, setCredentialsModal] = useState(null);
  const [deleteStoreModal, setDeleteStoreModal] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [expandedOwners, setExpandedOwners] = useState(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState('info');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  // Handlers
  const toggleOwnerExpansion = (ownerId) => {
    const next = new Set(expandedOwners);
    if (next.has(ownerId)) next.delete(ownerId);
    else next.add(ownerId);
    setExpandedOwners(next);
  };

  const handleCreateStore = async () => {
    setIsCreating(true);
    try {
      const payload = { ...newStore };
      if (provisionMode === 'existing') {
        if (!newStore.owner_id) return setErrorMessage('Please select an existing business owner.');
        if (!newStore.manager_name || !newStore.manager_email) return setErrorMessage('Manager details required.');
        payload.admin_name = ''; payload.admin_email = '';
      } else {
        if (!newStore.admin_name || !newStore.admin_email) return setErrorMessage('Owner details required.');
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
      setErrorMessage('Internal connection error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteStore = async () => {
    if (!deleteStoreModal) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/stores/${deleteStoreModal.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteStoreModal(null);
        fetchData();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to delete store node');
      }
    } catch (e) {
      setErrorMessage('Network error during node termination');
    } finally {
      setIsDeleting(false);
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

  const handleUpdateTier = async (ownerId, newTier) => {
    try {
      // Find a store ID for this owner to use the tier update endpoint
      const owner = owners.find(o => o.owner_id === ownerId);
      if (!owner || !owner.stores || owner.stores.length === 0) {
        return setErrorMessage('Cannot update tier: No nodes found for this owner.');
      }
      
      const storeId = owner.stores[0].id;
      const res = await fetch(`/api/stores/${storeId}/tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier, payment_confirmed: true })
      });

      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to update subscription tier');
      }
    } catch (err) {
      setErrorMessage('Connection error during tier migration');
    }
  };

  const toggleStoreStatus = async (storeId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to toggle node status');
      }
    } catch (err) {
      setErrorMessage('Connection error during status toggle');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">{t('syncing_master_control')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 min-h-screen">
      {/* Header / Global Command Bar */}
      <div className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center gap-6 animate-fade-in-up">
        <div className="relative w-full max-w-2xl group">
           <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 z-10 font-bold scale-125">terminal</span>
           <input 
             type="text"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             placeholder="Execute global command cluster search..."
             className="w-full bg-white/40 backdrop-blur-md border border-emerald-100/30 rounded-[2.5rem] py-5 pl-16 pr-8 text-sm font-black text-slate-900 shadow-xl shadow-slate-200/50 relative z-10 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-300"
           />
           {searchTerm && (
             <button 
               onClick={() => setSearchTerm('')}
               className="absolute right-6 top-1/2 -translate-y-1/2 z-20 text-slate-400 hover:text-emerald-600 transition-colors"
             >
               <span className="material-symbols-outlined text-sm">close</span>
             </button>
           )}
        </div>
        
        <div className="flex items-center gap-6">
           <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.2em] mb-0.5">{t('identity_protocol')}</p>
              <p className="text-sm font-black text-on-surface tracking-tight">{t('root_admin')}</p>
           </div>
           <Link href="/" className="w-12 h-12 rounded-[1.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-center text-slate-400 hover:text-emerald-700 hover:scale-110 transition-all">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
           </Link>
        </div>
      </div>
      
      {/* View Dispatcher */}
      <div className="relative pt-4 overflow-hidden min-h-[80vh]">
         {activeView === 'overview' && (
           <MasterOverview 
             user={user} 
             owners={owners.filter(o => 
               o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               o.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
               o.stores?.some(s => s.store_name.toLowerCase().includes(searchTerm.toLowerCase()))
             )} 
             stores={stores.filter(s => s.store_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.city.toLowerCase().includes(searchTerm.toLowerCase()))} 
             masterStats={masterStats} health={health} logs={logs} t={t} router={router} fetchData={fetchData}
             setProvisionMode={setProvisionMode} setShowCreateModal={setShowCreateModal} broadcastSeverity={broadcastSeverity} setBroadcastSeverity={setBroadcastSeverity}
             broadcastMessage={broadcastMessage} setBroadcastMessage={setBroadcastMessage} handleSendBroadcast={handleSendBroadcast} isBroadcasting={isBroadcasting}
           />
         )}
         {activeView === 'nodes' && (
           <MasterNodes 
             user={user} 
             owners={owners.filter(o => 
               o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               o.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
               o.stores?.some(s => s.store_name.toLowerCase().includes(searchTerm.toLowerCase()))
             )} 
             stores={stores.filter(s => s.store_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.city.toLowerCase().includes(searchTerm.toLowerCase()))} 
             t={t} expandedOwners={expandedOwners} toggleOwnerExpansion={toggleOwnerExpansion}
             setProvisionMode={setProvisionMode} setShowCreateModal={setShowCreateModal} setNewStore={setNewStore} newStore={newStore}
             setDeleteStoreModal={setDeleteStoreModal} handleUpdateTier={handleUpdateTier} toggleStoreStatus={toggleStoreStatus}
           />
         )}
         {activeView === 'insights' && <MasterInsights masterStats={masterStats} t={t} />}
         {activeView === 'logs' && <MasterLogs logs={logs} t={t} />}
         {activeView === 'security' && (
           <MasterSecurity 
             t={t} health={health} logs={logs} broadcastMessage={broadcastMessage} setBroadcastMessage={setBroadcastMessage}
             handleSendBroadcast={handleSendBroadcast} isBroadcasting={isBroadcasting}
           />
         )}
      </div>

      {/* Global Modals */}
      <ProvisionNodeModal 
        isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} provisionMode={provisionMode} 
        setProvisionMode={setProvisionMode} newStore={newStore} setNewStore={setNewStore} owners={owners} 
        isCreating={isCreating} handleCreateStore={handleCreateStore} t={t} 
      />

      <CredentialsModal credentials={credentialsModal} onClose={() => setCredentialsModal(null)} t={t} />

      <DeleteStoreModal 
        isOpen={!!deleteStoreModal} onClose={() => setDeleteStoreModal(null)} modalState={deleteStoreModal} 
        setModalState={setDeleteStoreModal} isDeleting={isDeleting} handleDeleteStore={handleDeleteStore} t={t} 
      />

      {/* Global Error Modal */}
      {errorMessage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl border border-red-100 animate-fade-in-up text-center">
            <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center text-red-600 mx-auto mb-8 shadow-inner">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">{t('system_alert')}</h3>
            <p className="text-slate-500 font-medium italic mb-10 leading-relaxed text-sm">{errorMessage}</p>
            <button onClick={() => setErrorMessage(null)} className="w-full py-5 bg-theme-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all">Acknowledge</button>
          </div>
        </div>
      )}
    </div>
  );
}
