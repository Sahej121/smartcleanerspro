'use client';

import React from 'react';

export default function ProvisionNodeModal({ 
  isOpen, 
  onClose, 
  provisionMode, 
  setProvisionMode, 
  newStore, 
  setNewStore, 
  owners, 
  isCreating, 
  handleCreateStore, 
  t 
}) {
  if (!isOpen) return null;

  return (
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
                  <option value="software_only">{t('software_only')}</option>
                  <option value="hardware_bundle">{t('hardware_bundle')}</option>
                  <option value="enterprise">{t('enterprise')}</option>
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
              onClick={onClose}
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
  );
}
