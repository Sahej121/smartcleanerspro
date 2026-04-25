'use client';

import React from 'react';
import { formatCurrency } from '@/lib/currency-utils';

export default function MasterNodes({
  user,
  owners,
  stores,
  t,
  expandedOwners,
  toggleOwnerExpansion,
  handleUpdateTier,
  setProvisionMode,
  setShowCreateModal,
  setNewStore,
  newStore,
  toggleStoreStatus,
  setDeleteStoreModal
}) {
  const totalStores = user?.id == 1 ? owners.reduce((acc, o) => acc + (o.stores?.length || 0), 0) : stores.length;

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
             <h1 className="text-4xl font-black font-headline uppercase leading-none">{t('manage_nodes')}</h1>
             <p className="text-slate-500 italic mt-2">{t('total_of')} {totalStores} {t('provisioned_nodes')}</p>
          </div>
             <button onClick={() => {
               setProvisionMode('new');
               setShowCreateModal(true);
             }} className="px-8 py-4 premium-gradient text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                {t('provision_new_instance')}
             </button>
       </div>
       
       <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-x-auto">
          {user?.id == 1 ? (
             <table className="w-full min-w-[700px]">
                <thead>
                   <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                      <th className="py-6 text-left">{t('business_owner')}</th>
                      <th className="py-6 text-left">{t('tier_access')}</th>
                      <th className="py-6 text-center">{t('nodes')}</th>
                      <th className="py-6 text-right">{t('revenue_contrib')}</th>
                      <th className="py-6 text-right">{t('mgmt_actions')}</th>
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
                                 <option value="software_only">{t('software_only')}</option>
                                 <option value="hardware_bundle">{t('hardware_bundle')}</option>
                                 <option value="enterprise">{t('enterprise')}</option>
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
                                             <th className="py-4 px-6 text-left">{t('node_id')}</th>
                                             <th className="py-4 px-6 text-left">{t('location')}</th>
                                             <th className="py-4 px-6 text-left">Status</th>
                                             <th className="py-4 px-6 text-right">Revenue</th>
                                             <th className="py-4 px-6 text-right">{t('actions')}</th>
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
                                                         {store.status === 'active' ? t('suspend') : t('restart')}
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
                      <th className="py-6 text-left">{t('identity')}</th>
                      <th className="py-6 text-left">{t('location_index')}</th>
                      <th className="py-6 text-left">{t('health_status')}</th>
                      <th className="py-6 text-right">{t('revenue_contrib')}</th>
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
                               {store.status === 'active' ? t('operational') : t('suspended')}
                            </span>
                         </td>
                         <td className="py-6 text-right font-black text-sm text-on-surface">{formatCurrency(store.total_revenue, store.country || 'United Kingdom')}</td>
                         <td className="py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => toggleStoreStatus(store.id, store.status)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${store.status === 'active' ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                              >
                                 {store.status === 'active' ? t('suspend_access') : t('restore_service')}
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
}
