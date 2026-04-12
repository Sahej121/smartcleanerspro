'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

function formatCurrencyINR(val) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

export default function BusinessOwner({ user }) {
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
    return 'All stores';
  }, [selectedStore]);

  const viewingLabel = useMemo(() => {
    if (selectedStore) return `Viewing: ${selectedStore.store_name}${selectedStore.city ? ` • ${selectedStore.city}` : ''}`;
    return 'Viewing: All stores';
  }, [selectedStore]);

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
        <p className="text-slate-500 font-medium animate-pulse">Loading owner dashboard...</p>
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
            {stores.length} store{stores.length === 1 ? '' : 's'} in portfolio
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
              <option value="all">All stores</option>
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
            New Order
          </Link>
          <Link href="/admin/settings" className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest font-bold text-sm text-on-surface hover:bg-surface-container-low hover:shadow-md transition-all">
            <span className="material-symbols-outlined text-lg">settings</span>
            Settings
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
                <h3 className="text-sm font-semibold text-on-surface-variant mb-1">Total Revenue (Today)</h3>
                <p className="text-4xl font-extrabold tracking-tighter text-on-surface font-headline">
                  {formatCurrencyINR(stats?.todayRevenue || 0)}
                </p>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500">
              {selectedStoreId === 'all' ? 'Across all stores' : 'Selected store'} • Paid orders only
            </p>
          </div>
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-40 group-hover:opacity-60 group-hover:scale-125 transition-all duration-700" />
        </div>

        <div className="p-6 rounded-3xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-outline-variant/10 group hover:border-primary/20 transition-all card-hover">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-100 transition-all duration-300">
              <span className="material-symbols-outlined text-2xl">receipt_long</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-on-surface-variant mb-1">Orders (Today)</h3>
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
            <h3 className="text-sm font-bold text-white/80 mb-1">Active Garments</h3>
            <p className="text-4xl font-extrabold tracking-tighter text-white font-headline">
              {stats?.activeGarments ?? 0}
            </p>
          </div>
          <Link href="/orders" className="mt-4 py-2 w-full bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all backdrop-blur-sm relative z-10 active:scale-95 flex items-center justify-center gap-1">
            Track Pipeline <span className="material-symbols-outlined text-sm">chevron_right</span>
          </Link>
        </div>

        <div className="p-6 rounded-3xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-outline-variant/10 group hover:border-primary/20 transition-all card-hover hidden lg:flex">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-100 transition-all duration-300">
              <span className="material-symbols-outlined text-2xl">inventory_2</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-on-surface-variant mb-1">Stock Health</h3>
            <p className="text-3xl font-extrabold tracking-tighter text-on-surface font-headline">
              {stats?.stockHealth ?? 0}%
            </p>
            <p className="text-xs font-bold text-slate-400 mt-1">
              {stats?.inventoryAlerts ? `${stats.inventoryAlerts} low-stock alert(s)` : 'All stocked'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent orders across stores */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-extrabold tracking-tight text-on-surface font-headline">Recent Orders (All Stores)</h2>
            <Link href="/orders" className="text-primary text-sm font-bold hover:underline tracking-tight flex items-center gap-1 group">
              View All
              <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>
          </div>
          <div className="bg-surface-container-lowest rounded-3xl shadow-sm overflow-x-auto border border-outline-variant/10">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-on-surface-variant">Order</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-on-surface-variant">Store</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-on-surface-variant">Customer</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-on-surface-variant">Status</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-on-surface-variant text-right">Amount</th>
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
                      {o.customer_name || 'Walk-in'}
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
                      {formatCurrencyINR(o.total_amount)}
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
              <h2 className="text-lg font-extrabold tracking-tight text-on-surface font-headline">Stores Earnings</h2>
              <Link href="/admin/settings" className="text-xs font-bold text-slate-500 hover:text-primary transition-colors">
                Manage →
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
                    <p className="text-sm font-black text-emerald-700">{formatCurrencyINR(s.total_revenue)}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.order_count} orders</p>
                  </div>
                </div>
              ))}
              {(!stats?.stores || stats.stores.length === 0) && (
                <p className="text-sm text-slate-500 font-medium">No stores found.</p>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-lg font-extrabold tracking-tight text-on-surface font-headline">Staff</h2>
              <Link href="/admin/analytics/staff" className="text-xs font-bold text-slate-500 hover:text-primary transition-colors">
                Analytics →
              </Link>
            </div>
            <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-on-surface">Total staff</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Across all stores</p>
                </div>
                <p className="text-2xl font-black text-on-surface font-headline">{stats?.totalStaff ?? 0}</p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-lg font-extrabold tracking-tight text-on-surface font-headline">Inventory</h2>
              <Link href="/inventory" className="text-xs font-bold text-slate-500 hover:text-primary transition-colors">
                View →
              </Link>
            </div>
            <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/10 p-6 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-on-surface">Low stock items</p>
                <p className="text-sm font-black text-amber-700">{stats?.inventoryAlerts ?? 0}</p>
              </div>
              <p className="text-xs font-medium text-slate-500">
                {stats?.lowStockItems || 'All stocked'}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

