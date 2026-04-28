'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { fetchWithRetry } from '@/lib/fetchWithRetry';

export default function InventoryPage() {
  const { t } = useLanguage();
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [receiveQty, setReceiveQty] = useState('');
  const [auditQty, setAuditQty] = useState('');
  const [isOther, setIsOther] = useState(false);
  const [otherName, setOtherName] = useState('');
  const [otherUnit, setOtherUnit] = useState('units');

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setInventory(data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleReceiveStock = async () => {
    if (!isOther && (!selectedItem || !receiveQty)) return;
    if (isOther && (!otherName || !receiveQty)) return;

    const qty = parseFloat(receiveQty);

    try {
      if (isOther) {
        // STRICT for new item creation
        const res = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Idempotency-Key': crypto.randomUUID()
          },
          body: JSON.stringify({
            item_name: otherName,
            quantity: qty,
            unit: otherUnit,
            reorder_level: 10
          }),
        });
        if (!res.ok) throw new Error('Failed to create item');
        fetchInventory();
      } else {
        // OPTIMISTIC + RETRY for existing item update
        const itemId = selectedItem.id;
        
        // Optimistic update with "syncing" state
        setInventory(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, quantity: parseFloat(item.quantity) + qty, syncStatus: 'syncing' }
            : item
        ));

        setShowReceiveModal(false);
        setSelectedItem(null);
        setIsOther(false);
        setOtherName('');
        setReceiveQty('');

        try {
          await fetchWithRetry('/api/inventory', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: itemId, quantity: qty, action: 'receive' }),
          });

          // Mark as synced
          setInventory(prev => prev.map(item => 
            item.id === itemId ? { ...item, syncStatus: 'synced' } : item
          ));
          
          // Clear synced state after a delay
          setTimeout(() => {
            setInventory(prev => prev.map(item => 
              item.id === itemId ? { ...item, syncStatus: null } : item
            ));
          }, 3000);
        } catch (err) {
          // Mark as failed (No rollback as per requirements)
          setInventory(prev => prev.map(item => 
            item.id === itemId ? { ...item, syncStatus: 'failed' } : item
          ));
        }
        return; // Early return since we already cleared modal state
      }

      setShowReceiveModal(false);
      setSelectedItem(null);
      setIsOther(false);
      setOtherName('');
      setReceiveQty('');
    } catch (error) {
      alert('Failed to receive stock.');
    }
  };

  const handleAuditStock = async () => {
    if (!selectedItem || !auditQty) return;
    try {
      // STRICT for audit overrides
      const res = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Idempotency-Key': crypto.randomUUID()
        },
        body: JSON.stringify({ id: selectedItem.id, quantity: parseFloat(auditQty) }),
      });
      if (!res.ok) throw new Error('Failed to audit stock');
      
      setShowAuditModal(false);
      setSelectedItem(null);
      setAuditQty('');
      fetchInventory();
    } catch (error) {
      alert('Failed to audit stock. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    if (status === t('optimal')) return 'bg-primary/10 text-primary border border-primary/20';
    if (status === t('low_stock')) return 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse';
    if (status === t('medium')) return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    return 'bg-theme-surface-container text-theme-text-muted border border-theme-border';
  };

  const filteredInventory = inventory.filter(item =>
    item.item_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = inventory.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
  const lowStockCount = inventory.filter(i => i.status === t('low_stock')).length;
  const totalItems = inventory.length;

  return (
    <div className="p-4 lg:p-8 max-w-8xl mx-auto min-h-screen bg-background text-theme-text font-sans selection:bg-primary/30 relative">
      {/* Background Glows */ }
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 relative z-10 animate-fade-in-down">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-12 h-12 rounded-[1.2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
               <span className="material-symbols-outlined text-primary text-2xl">warehouse</span>
             </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-theme-text font-headline">{t('inventory_control')}</h1>
          </div>
          <p className="text-theme-text-muted font-bold text-lg max-w-2xl">{t('inventory_control_desc')}</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-4 rounded-[1.5rem] border border-theme-border bg-theme-surface-container font-black text-xs uppercase tracking-widest text-theme-text hover:bg-theme-text hover:text-background transition-all shadow-lg flex items-center gap-3">
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export Audit
          </button>
          <button
            onClick={() => { setSelectedItem(null); setIsOther(false); setShowReceiveModal(true); }}
            className="px-6 py-4 rounded-[1.5rem] primary-gradient text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Receive Stock
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12 relative z-10">
        {[
          { label: t('total_items'), value: totalItems, sub: t('tracked_in_system'), icon: 'account_balance_wallet', color: 'primary' },
          { 
            label: t('alerts'), 
            value: lowStockCount, 
            sub: lowStockCount > 0 ? t('require_reorder') : t('all_stocked'), 
            icon: lowStockCount > 0 ? 'warning' : 'check_circle', 
            color: lowStockCount > 0 ? 'amber' : 'primary',
            alert: lowStockCount > 0
          },
          { label: t('stock_health'), value: `${totalItems > 0 ? Math.round(((totalItems - lowStockCount) / totalItems) * 100) : 100}%`, sub: t('optimal_levels'), icon: 'health_and_safety', color: 'blue' },
          { label: t('total_volume'), value: totalValue.toLocaleString(), sub: t('units_across_items'), icon: 'straighten', color: 'indigo' },
        ].map((stat, idx) => (
          <div key={idx} className={`relative rounded-[2rem] p-8 flex flex-col justify-between group overflow-hidden transition-transform duration-500 hover:-translate-y-2 animate-fade-in-up shadow-xl ${
            stat.alert 
              ? 'bg-amber-950/20 border border-amber-500/30 shadow-amber-900/10' 
              : 'bg-surface border border-theme-border shadow-theme-border/5'
          }`} style={{ animationDelay: `${idx * 100}ms` }}>
            {stat.alert && <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none"></div>}
            
            <div className="flex justify-between items-start mb-6 relative z-10">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${
                 stat.alert ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-primary/10 text-primary border-primary/20'
               }`}>
                  <span className={`material-symbols-outlined ${stat.alert ? 'animate-pulse' : ''}`}>{stat.icon}</span>
               </div>
               <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${stat.alert ? 'bg-amber-500/10 text-amber-500' : 'text-theme-text-muted bg-theme-surface-container'}`}>{stat.label}</span>
            </div>
            <div className="relative z-10">
              <h2 className={`text-4xl font-black font-headline tracking-tighter ${stat.alert ? 'text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-theme-text'}`}>{stat.value}</h2>
              <p className="text-[10px] text-theme-text-muted font-black mt-2 tracking-[0.2em] uppercase">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between animate-fade-in-up mb-6 relative z-10">
        <div className="relative w-full max-w-md group/search">
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-theme-text-muted transition-colors group-focus-within/search:text-primary">search</span>
          <input
            className="w-full bg-surface border border-theme-border rounded-full py-4 pl-14 pr-6 text-sm font-bold placeholder:text-theme-text-muted text-theme-text focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none shadow-xl shadow-theme-border/5"
            placeholder={t('search_inventory_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Modern Flex List (Table Replacement) */}
      <div className="space-y-4 relative z-10 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        {/* Pseudo Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-6 px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-black text-theme-text-muted border-b border-theme-border/50">
          <div className="col-span-4 lg:col-span-3">{t('item_profile')}</div>
          <div className="col-span-3 lg:col-span-3">{t('stock_level')}</div>
          <div className="col-span-2 lg:col-span-2">{t('runway_forecast')}</div>
          <div className="col-span-2 lg:col-span-2">{t('health')}</div>
          <div className="col-span-1 lg:col-span-2 text-right">{t('actions')}</div>
        </div>

        {loading ? (
          <div className="p-20 text-center bg-surface border border-theme-border rounded-[3rem] shadow-xl">
            <div className="w-16 h-16 rounded-full border-4 border-theme-border border-t-primary animate-spin mx-auto mb-6"></div>
            <p className="text-xs font-black text-theme-text-muted uppercase tracking-[0.3em] animate-pulse">{t('inventory_diagnostics')}</p>
          </div>
        ) : filteredInventory.length > 0 ? (
          <div className="space-y-3">
            {filteredInventory.map((item, idx) => {
              const reorderLevel = parseFloat(item.reorder_level) || 10;
              const qty = parseFloat(item.quantity) || 0;
              const maxStock = Math.max(reorderLevel * 4, qty);
              const percent = Math.min(100, (qty / maxStock) * 100);
              const isLow = qty <= reorderLevel;

              return (
                <div 
                  key={item.id} 
                  className={`group relative grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 lg:p-8 rounded-[2rem] bg-surface border transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] ${
                    isLow ? 'border-amber-500/30' : 'border-theme-border hover:border-primary/30'
                  }`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {isLow && <div className="absolute inset-0 bg-amber-500/5 rounded-[2rem] pointer-events-none"></div>}

                  {/* 1. Item Details */}
                  <div className="md:col-span-4 lg:col-span-3 flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500 ${
                        isLow ? 'bg-amber-500/20 text-amber-500' : 'bg-theme-surface-container text-theme-text-muted group-hover:bg-primary/10 group-hover:text-primary'
                      }`}>
                        <span className="material-symbols-outlined text-2xl">inventory_2</span>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-base font-black truncate transition-colors ${isLow ? 'text-amber-50 text-shadow-sm' : 'text-theme-text group-hover:text-primary'}`}>
                          {item.item_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted">ID-{item.id}</span>
                          <span className="w-1 h-1 rounded-full bg-theme-border"></span>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted">{item.unit}</span>
                        </div>
                      </div>
                  </div>

                  {/* 2. Stock Level */}
                  <div className="md:col-span-3 lg:col-span-3 space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xl font-black font-headline tracking-tighter text-theme-text">{qty.toLocaleString()} <span className="text-theme-text-muted text-sm tracking-normal">/ {item.unit}</span></span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isLow ? 'text-amber-500' : 'text-theme-text-muted'}`}>{percent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-theme-surface-container rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} 
                          style={{ width: `${percent}%` }}
                        ></div>
                    </div>
                  </div>

                  {/* 3. Run Out */}
                  <div className="md:col-span-2 lg:col-span-2">
                    {item.runway_days ? (
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 text-sm font-black text-theme-text">
                          <span className="material-symbols-outlined text-[16px] text-theme-text-muted">event</span>
                          {new Date(Date.now() + item.runway_days * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${item.runway_days < 7 ? 'text-amber-500' : 'text-primary'}`}>
                          {item.runway_days < 7 ? t('critical') : t('nominal')}: ~{item.runway_days}d
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Forecasting...</span>
                        </div>
                        <p className="text-[9px] font-bold text-theme-text-muted italic opacity-70">Awaiting usage data</p>
                      </div>
                    )}
                  </div>

                  {/* 4. Status & Sync Indicator */}
                  <div className="md:col-span-2 lg:col-span-2 flex flex-col items-start gap-2">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${getStatusColor(item.status)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {item.status}
                    </span>
                    
                    {item.syncStatus === 'syncing' && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-500 animate-pulse">
                        <span className="material-symbols-outlined text-[12px] animate-spin">sync</span> Syncing
                      </span>
                    )}
                    {item.syncStatus === 'synced' && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary animate-fade-in">
                        <span className="material-symbols-outlined text-[12px]">cloud_done</span> Synced
                      </span>
                    )}
                    {item.syncStatus === 'failed' && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-500 animate-fade-in">
                        <span className="material-symbols-outlined text-[12px]">cloud_off</span> Sync Failed
                      </span>
                    )}
                  </div>

                  {/* 5. Actions */}
                  <div className="md:col-span-1 lg:col-span-2 flex justify-end gap-2">
                    <button
                      onClick={() => { setSelectedItem(item); setAuditQty(item.quantity); setShowAuditModal(true); }}
                      title="Audit Current Stock"
                      className="w-12 h-12 rounded-[1rem] bg-theme-surface-container border border-theme-border text-theme-text-muted hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex items-center justify-center active:scale-95 group/btn"
                    >
                        <span className="material-symbols-outlined text-[20px] group-hover/btn:scale-110 transition-transform">equalizer</span>
                    </button>
                    <button
                      onClick={() => { setSelectedItem(item); setIsOther(false); setReceiveQty(''); setShowReceiveModal(true); }}
                      title="Add Received Stock"
                      className="w-12 h-12 rounded-[1rem] bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.1)] group/btn"
                    >
                        <span className="material-symbols-outlined text-[20px] group-hover/btn:scale-110 transition-transform">add_shopping_cart</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-20 text-center bg-surface border border-theme-border rounded-[3rem] shadow-xl">
            <div className="w-20 h-20 rounded-full bg-theme-surface-container flex items-center justify-center mx-auto mb-6">
               <span className="material-symbols-outlined text-5xl text-theme-text-muted">inventory_2</span>
            </div>
            <h3 className="text-2xl font-black text-theme-text font-headline mb-2">{t('no_resources_found')}</h3>
            <p className="text-sm font-bold text-theme-text-muted uppercase tracking-[0.2em]">{t('no_resources_desc')}</p>
          </div>
        )}
      </div>

      {/* Advanced Modals (Audit/Receive) */}
      {[
        { 
          show: showAuditModal, 
          close: () => setShowAuditModal(false), 
          title: t('system_audit'), 
          icon: 'equalizer', 
          color: 'indigo',
          content: () => (
             <>
                <div className="bg-indigo-500/10 p-5 rounded-[1.5rem] border border-indigo-500/20 mb-6 flex gap-4">
                  <span className="material-symbols-outlined text-indigo-400">info</span>
                  <p className="text-xs text-indigo-200 font-bold leading-relaxed">
                    <>{t('audit_desc').split('{item_name}')[0]}<strong className="text-indigo-100">{selectedItem?.item_name}</strong>{t('audit_desc').split('{item_name}')[1]}</>
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted mb-3 block">{t('actual_weight_count')}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    autoFocus
                    className="w-full bg-theme-surface-container border border-theme-border rounded-[1.5rem] p-5 text-xl font-black font-headline text-theme-text focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all placeholder:text-theme-text-muted/50"
                    placeholder={`${t('currently')} ${selectedItem?.quantity} ${selectedItem?.unit}`}
                    value={auditQty}
                    onChange={e => setAuditQty(e.target.value)}
                  />
                </div>
             </>
          ),
          actionFn: handleAuditStock,
          actionLabel: t('lock_audit_record'),
          actionDisabled: !selectedItem || auditQty === ''
        },
        { 
          show: showReceiveModal, 
          close: () => { setShowReceiveModal(false); setIsOther(false); setOtherName(''); }, 
          title: t('stock_ingestion'), 
          icon: 'add_shopping_cart', 
          color: 'primary',
          content: () => (
            <div className="space-y-6">
              {!selectedItem && !isOther && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted mb-3 block">{t('origin_item')}</label>
                  <select
                    className="w-full bg-theme-surface-container border border-theme-border rounded-[1.5rem] p-5 text-sm font-black text-theme-text focus:ring-4 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all appearance-none"
                    onChange={e => {
                      if (e.target.value === 'other') setIsOther(true);
                      else setSelectedItem(inventory.find(i => i.id === parseInt(e.target.value)));
                    }}
                  >
                    <option value="">{t('choose_item_placeholder')}</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>{item.item_name} ({item.quantity} {item.unit})</option>
                    ))}
                    <option value="other" className="text-primary font-black">+ Declare New Resource Type</option>
                  </select>
                </div>
              )}

              {isOther && !selectedItem && (
                <div className="space-y-5 animate-fade-in">
                  <div className="bg-primary/10 p-5 rounded-[1.5rem] border border-primary/20">
                     <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">fiber_new</span> Registering New Resource
                     </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted mb-3 block">{t('nomenclature')}</label>
                    <input
                      type="text"
                      autoFocus
                      className="w-full bg-theme-surface-container border border-theme-border rounded-[1.5rem] p-5 text-sm font-black text-theme-text focus:ring-4 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all placeholder:text-theme-text-muted/50"
                      placeholder="e.g. Bio-Solvent Formula X"
                      value={otherName}
                      onChange={e => setOtherName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted mb-3 block">{t('metric_unit')}</label>
                      <select 
                        className="w-full bg-theme-surface-container border border-theme-border rounded-[1.5rem] p-5 text-sm font-black text-theme-text focus:ring-4 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                        value={otherUnit}
                        onChange={e => setOtherUnit(e.target.value)}
                      >
                        <option value="liters">{t("liters")}</option>
                        <option value="units">{t("units")}</option>
                        <option value="kg">Kilograms</option>
                        <option value="bottles">{t("bottles")}</option>
                        <option value="rolls">{t("rolls")}</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button 
                        onClick={() => { setIsOther(false); setOtherName(''); }}
                        className="h-[60px] w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-theme-text-muted hover:text-red-400 bg-theme-surface-container rounded-[1.5rem] border border-theme-border transition-colors hover:border-red-500/30"
                      >
                        Abandon
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted mb-3 block">
                  {isOther ? t('initial_allocation_volume') : t('incoming_volume')}
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full bg-theme-surface-container border border-theme-border rounded-[1.5rem] p-5 text-xl font-black font-headline text-theme-text focus:ring-4 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all placeholder:text-theme-text-muted/50"
                  placeholder="e.g. 50"
                  value={receiveQty}
                  onChange={e => setReceiveQty(e.target.value)}
                />
              </div>
            </div>
          ),
          actionFn: handleReceiveStock,
          actionLabel: t('confirm_manifest_ingestion'),
          actionDisabled: (!isOther && (!selectedItem || !receiveQty)) || (isOther && (!otherName || !receiveQty))
        }
      ].map((modal, idx) => (
        modal.show && (
          <div key={idx} className="fixed inset-0 bg-background/80 backdrop-blur-3xl flex items-center justify-center p-4 z-50 animate-fade-in">
            {/* Modal Glow */}
            <div className={`absolute w-[500px] h-[500px] bg-${modal.color}-500/10 blur-[100px] rounded-full pointer-events-none`}></div>
            
            <div className="relative z-10 bg-surface rounded-[3rem] w-full sm:w-[95%] max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-theme-border overflow-hidden animate-scale-in">
              <div className="p-8 border-b border-theme-border/50 flex justify-between items-center bg-theme-surface-container/30">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center border shadow-inner ${
                    modal.color === 'indigo' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-primary/20 text-primary border-primary/30'
                  }`}>
                    <span className="material-symbols-outlined text-2xl">{modal.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-black font-headline tracking-tighter text-theme-text text-2xl">{modal.title}</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted">
                      {modal.icon === 'equalizer' ? t('override_database') : t('add_to_inventory')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={modal.close}
                  className="w-12 h-12 flex items-center justify-center rounded-[1rem] bg-theme-surface-container border border-theme-border hover:bg-theme-text hover:text-background text-theme-text-muted transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <div className="p-8">
                {modal.content()}
              </div>

              <div className="p-8 pt-0 flex justify-end gap-4">
                <button
                  onClick={modal.close}
                  className="px-8 py-5 rounded-[1.5rem] text-[10px] uppercase tracking-[0.2em] font-black text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-container transition-colors"
                >
                  Abort
                </button>
                <button
                  onClick={modal.actionFn}
                  disabled={modal.actionDisabled}
                  className={`px-8 py-5 rounded-[1.5rem] text-[10px] uppercase tracking-[0.2em] font-black text-white shadow-xl transition-all flex items-center gap-3 disabled:opacity-30 disabled:pointer-events-none active:scale-95 ${
                    modal.color === 'indigo' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 shadow-indigo-600/30' : 'primary-gradient shadow-primary/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{modal.icon === 'equalizer' ? 'security_update_warning' : 'check_circle'}</span>
                  {modal.actionLabel}
                </button>
              </div>
            </div>
          </div>
        )
      ))}
    </div>
  );
}
