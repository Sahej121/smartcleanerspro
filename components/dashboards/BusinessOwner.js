'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency-utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';



export default function BusinessOwner({ user }) {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState('all'); // 'all' | numeric store id (string)

  const selectedStore = useMemo(() => {
    if (selectedStoreId === 'all') return null;
    const id = parseInt(selectedStoreId, 10);
    if (!Number.isFinite(id)) return null;
    return stores.find(s => s.id === id) || null;
  }, [selectedStoreId, stores]);

  const headerStoreName = useMemo(() => {
    if (selectedStore) return selectedStore.store_name;
    return t('all_stores');
  }, [selectedStore, t]);

  const viewingLabel = useMemo(() => {
    if (selectedStore) return `${t('viewing')}: ${selectedStore.store_name}${selectedStore.city ? ` • ${selectedStore.city}` : ''}`;
    return `${t('viewing')}: ${t('all_stores')}`;
  }, [selectedStore, t]);

  // Load stores list once (for switcher options).
  useEffect(() => {
    let alive = true;
    async function fetchStores() {
      try {
        const res = await fetch('/api/stores');
        const data = await res.json();
        if (!alive) return;
        setStores(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to fetch stores:', e);
      }
    }
    fetchStores();
    return () => { alive = false; };
  }, []);

  // Fetch stats whenever the selected store changes.
  useEffect(() => {
    let alive = true;
    async function fetchStats() {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        if (selectedStoreId) qs.set('storeId', selectedStoreId);
        const res = await fetch(`/api/owner/stats?${qs.toString()}`);
        const data = await res.json();
        if (!alive) return;
        setStats(data);
      } catch (e) {
        console.error('Failed to fetch owner stats:', e);
      } finally {
        if (alive) setLoading(false);
      }
    }
    fetchStats();
    return () => { alive = false; };
  }, [selectedStoreId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">{t('loading_owner_dash')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface font-headline">
              {headerStoreName}
            </h1>
            <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
              {viewingLabel}
            </span>
          </div>
          <p className="text-on-surface-variant font-medium">
            {stores.length} {stores.length === 1 ? t('store') : t('stores')} {t('in_portfolio')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Store Switcher */}
          <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-3 py-2.5 shadow-sm">
            <span className="material-symbols-outlined text-slate-400 text-lg">store</span>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-transparent outline-none text-sm font-bold text-on-surface min-w-[220px]"
            >
              <option value="all">{t('all_stores')}</option>
              {stores.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.store_name}{s.city ? ` • ${s.city}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
          <Link href="/orders/new" className="flex items-center justify-center gap-2 px-6 py-2.5 premium-gradient text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-900/10 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-lg">add</span>
            {t('nav_new_order')}
          </Link>
          <Link href="/admin/staff" className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest font-bold text-sm text-on-surface hover:bg-surface-container-low hover:shadow-md transition-all">
            <span className="material-symbols-outlined text-lg">badge</span>
            {t('nav_staff')}
          </Link>
          <Link href="/admin/settings" className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest font-bold text-sm text-on-surface hover:bg-surface-container-low hover:shadow-md transition-all">
            <span className="material-symbols-outlined text-lg">settings</span>
            {t('settings')}
          </Link>
          </div>
        </div>
      </div>

      {/* KPI Row (same feel as current StoreAdmin, but aggregated across stores) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div className="md:col-span-2 lg:col-span-2 p-6 rounded-3xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden group border border-outline-variant/10 card-hover">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-on-surface-variant mb-1">{t('total_revenue_today')}</h3>
                <p className="text-4xl font-extrabold tracking-tighter text-on-surface font-headline">
                  {formatCurrency(stats?.todayRevenue || 0, selectedStore?.country || user?.country)}
                </p>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500">
              {selectedStoreId === 'all' ? t('across_all_stores') : t('selected_store')} • {t('paid_orders_only')}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-outline-variant/10 group hover:border-primary/20 transition-all card-hover">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-100 transition-all duration-300">
              <span className="material-symbols-outlined text-2xl">receipt_long</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-on-surface-variant mb-1">{t('orders_today')}</h3>
            <p className="text-3xl font-extrabold tracking-tighter text-on-surface font-headline">
              {stats?.todayOrders ?? 0}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl primary-gradient text-white shadow-xl shadow-emerald-900/10 flex flex-col justify-between relative overflow-hidden group card-hover">
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex justify-between items-start relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_laundry_service</span>
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <h3 className="text-sm font-bold text-white/80 mb-1">{t('active_garments')}</h3>
            <p className="text-4xl font-extrabold tracking-tighter text-white font-headline">
              {stats?.activeGarments ?? 0}
            </p>
          </div>
          <Link href="/orders" className="mt-4 py-2 w-full bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all backdrop-blur-sm relative z-10 active:scale-95 flex items-center justify-center gap-1">
            {t('track_pipeline')} <span className="material-symbols-outlined text-sm">chevron_right</span>
          </Link>
        </div>

        <div className="p-6 rounded-3xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-outline-variant/10 group hover:border-primary/20 transition-all card-hover hidden lg:flex">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-100 transition-all duration-300">
              <span className="material-symbols-outlined text-2xl">inventory_2</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-on-surface-variant mb-1">{t('stock_health')}</h3>
            <p className="text-3xl font-extrabold tracking-tighter text-on-surface font-headline">
              {stats?.stockHealth ?? 0}%
            </p>
            <p className="text-xs font-bold text-slate-400 mt-1">
              {stats?.inventoryAlerts ? `${stats.inventoryAlerts} ${t('low_stock_alerts')}` : t('all_stocked')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent orders across stores */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-extrabold tracking-tight text-on-surface font-headline">{t('recent_orders_all_stores')}</h2>
            <Link href="/orders" className="text-primary text-sm font-bold hover:underline tracking-tight flex items-center gap-1 group">
              {t('view_all')}
              <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>
          </div>
          <div className="bg-surface-container-lowest rounded-3xl shadow-sm overflow-x-auto border border-outline-variant/10">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-on-surface-variant">{t('order')}</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-on-surface-variant">{t('store')}</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-on-surface-variant">{t('customer')}</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-on-surface-variant">{t('status')}</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-on-surface-variant text-right">{t('amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {(stats?.recentOrders || []).map((o) => (
                  <tr key={o.id} className="hover:bg-emerald-50/30 transition-all">
                    <td className="px-6 py-5">
                      <Link href={`/orders/${o.id}`} className="text-sm font-bold text-emerald-800 hover:text-emerald-600 transition-colors">
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-5 text-sm font-semibold text-slate-500">
                      {o.store_name || '—'}
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface">
                      {o.customer_name || t('walkin')}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                        o.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                        o.status === 'processing' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-sm text-on-surface whitespace-nowrap">
                      {formatCurrency(o.total_amount, o.country || user?.country)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stores earnings + staff + inventory summary */}
        <div className="space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-lg font-extrabold tracking-tight text-on-surface font-headline">{t('stores_earnings')}</h2>
              <Link href="/admin/settings" className="text-xs font-bold text-slate-500 hover:text-primary transition-colors">
                {t('manage')} →
              </Link>
            </div>
            <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/10 p-6 space-y-4">
              {(stats?.stores || []).slice(0, 6).map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-on-surface">{s.store_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.city || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-700">{formatCurrency(s.total_revenue, s.country || user?.country)}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.order_count} {t('orders')}</p>
                  </div>
                </div>
              ))}
              {(!stats?.stores || stats.stores.length === 0) && (
                <p className="text-sm text-slate-500 font-medium">{t('no_stores_found')}</p>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-lg font-extrabold tracking-tight text-on-surface font-headline">{t('staff')}</h2>
              <Link href="/admin/analytics/staff" className="text-xs font-bold text-slate-500 hover:text-primary transition-colors">
                {t('analytics')} →
              </Link>
            </div>
            <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-on-surface">{t('total_staff')}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('across_all_stores')}</p>
                </div>
                <p className="text-2xl font-black text-on-surface font-headline">{stats?.totalStaff ?? 0}</p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-lg font-extrabold tracking-tight text-on-surface font-headline">{t('inventory')}</h2>
              <Link href="/inventory" className="text-xs font-bold text-slate-500 hover:text-primary transition-colors">
                {t('view_action')} →
              </Link>
            </div>
            <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/10 p-6 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-on-surface">{t('low_stock_items')}</p>
                <p className="text-sm font-black text-amber-700">{stats?.inventoryAlerts ?? 0}</p>
              </div>
              <p className="text-xs font-medium text-slate-500">
                {stats?.lowStockItems || t('all_stocked')}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

