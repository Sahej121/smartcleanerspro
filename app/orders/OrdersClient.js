'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/formatters';

const STATUS_TABS = ['all', 'received', 'processing', 'ready', 'delivered', 'cancelled'];

export default function OrdersClient({ initialOrders, pagination }) {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'all');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (activeTab !== 'all') params.set('status', activeTab);
    else params.delete('status');
    
    if (debouncedSearch) params.set('search', debouncedSearch);
    else params.delete('search');

    // Reset to page 1 on new filter/search
    params.delete('page');

    router.push(`/orders?${params.toString()}`, { scroll: false });
  }, [activeTab, debouncedSearch]);

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage);
    router.push(`/orders?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-background text-theme-text p-4 lg:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-fade-in-up">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-surface border border-theme-border p-8 rounded-[3rem] relative overflow-hidden group shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>

          <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
             <div className="w-16 h-16 rounded-[1.5rem] bg-background border border-theme-border text-emerald-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all shrink-0">
               <span className="material-symbols-outlined text-3xl fill">receipt_long</span>
             </div>
             <div>
                <div className="flex items-center gap-3 mb-1">
                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">{t('operations')}</span>
                </div>
                <h1 className="text-4xl font-black text-theme-text tracking-tighter">{t('order_ledger')}</h1>
                <p className="text-theme-text-muted font-medium text-sm mt-1">{t('order_ledger_desc')}</p>
             </div>
          </div>
          
          <div className="flex gap-4 relative z-10 w-full md:w-auto">
             <Link href="/orders/new" className="w-full md:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                {t('new_walkin_pickup')}
             </Link>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="flex gap-2 p-2 bg-surface border border-theme-border rounded-[2rem] overflow-x-auto no-scrollbar max-w-full">
            {STATUS_TABS.map(tab => (
              <button
                key={tab}
                className={`px-6 py-3 rounded-[1.25rem] text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : 'text-theme-text-muted border border-transparent hover:text-theme-text hover:bg-theme-bg'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {t(tab)}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-[350px] group shrink-0">
            <span className={`material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-lg transition-colors duration-300 ${search ? 'text-emerald-500' : 'text-theme-text-muted group-focus-within:text-emerald-500'}`}>search</span>
            <input
              className="w-full bg-surface border border-theme-border rounded-[1.5rem] py-4 pl-14 pr-6 text-sm font-bold text-theme-text placeholder:text-theme-text-muted outline-none transition-all duration-300 focus:border-emerald-500/50"
              placeholder={t('search_orders_placeholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Main Registry Table */}
        <div className="bg-surface rounded-[2.5rem] border border-theme-border overflow-hidden flex flex-col group hover:border-emerald-500/20 transition-colors shadow-sm">
          <div className="overflow-x-auto overflow-y-auto no-scrollbar flex-1 p-2">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="text-[9px] uppercase tracking-[0.2em] font-black text-theme-text-muted border-b border-theme-border bg-theme-bg/50">
                  <th className="px-8 py-5">{t('order_tracking')}</th>
                  <th className="px-8 py-5">{t('origin_customer')}</th>
                  <th className="px-8 py-5 text-center">{t('logistics_status')}</th>
                  <th className="px-8 py-5 text-center">{t('settlement')}</th>
                  <th className="px-8 py-5 text-right">{t('value')}</th>
                  <th className="px-8 py-5">{t('timestamp')}</th>
                  <th className="px-8 py-5 text-right">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/50">
                {initialOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-theme-bg border border-theme-border border-dashed rounded-[1.5rem] flex items-center justify-center text-theme-text-muted mb-4 text-opacity-30">
                          <span className="material-symbols-outlined text-3xl">inventory_2</span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted opacity-60">{t('no_logs_found')}</p>
                      </div>
                    </td>
                  </tr>
                ) : initialOrders.map((order) => {
                  const statusColorMap = {
                    'ready': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                    'processing': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                    'received': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                    'delivered': 'bg-slate-100 text-slate-500 border-slate-200',
                    'cancelled': 'bg-red-500/10 text-red-600 border-red-500/20'
                  };
                  const statusDotMap = {
                    'ready': 'bg-emerald-500',
                    'processing': 'bg-blue-500',
                    'received': 'bg-amber-500',
                    'delivered': 'bg-slate-400',
                    'cancelled': 'bg-red-500'
                  };
                  
                  return (
                  <tr key={order.id} className="group/row hover:bg-theme-bg/50 transition-all cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-emerald-600 group-hover/row:text-emerald-500 transition-colors">
                        {order.order_number}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-theme-bg border border-theme-border flex items-center justify-center text-[10px] font-black text-theme-text-muted uppercase group-hover/row:border-emerald-500/30 group-hover/row:text-emerald-600 transition-colors">
                          {order.customer_name?.charAt(0) || 'W'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-theme-text transition-colors">{order.customer_name || t('walkin_profile')}</p>
                          <p className="text-[9px] text-theme-text-muted font-bold uppercase tracking-wider">{order.customer_phone || t('immediate')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${statusColorMap[order.status] || 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDotMap[order.status] || 'bg-slate-500'}`}></span>
                        {t(order.status)}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border inline-block ${
                        order.payment_status === 'paid' ? 'border-emerald-500/20 text-emerald-600 bg-emerald-500/10' : 'border-amber-500/20 text-amber-600 bg-amber-500/10'
                      }`}>
                        {t(order.payment_status)}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="text-sm font-black text-theme-text">{formatCurrency(order.total_amount)}</p>
                      <p className="text-[9px] text-theme-text-muted font-bold uppercase tracking-widest">{order.item_count} {t('items')}</p>
                    </td>
                    <td className="px-8 py-6 text-[10px] font-bold text-theme-text-muted uppercase tracking-widest">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="w-8 h-8 rounded-xl bg-theme-bg border border-theme-border flex items-center justify-center text-theme-text-muted group-hover/row:border-emerald-500/50 group-hover/row:text-emerald-600 group-hover/row:bg-emerald-500/10 group-hover/row:translate-x-1 transition-all ml-auto">
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 py-8 border-t border-theme-border bg-theme-bg/30">
              <button 
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface border border-theme-border text-theme-text disabled:opacity-30 hover:bg-theme-bg transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <div className="flex items-center gap-2">
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const p = i + 1;
                  if (Math.abs(p - pagination.page) > 2 && p !== 1 && p !== pagination.totalPages) {
                    if (p === 2 || p === pagination.totalPages - 1) return <span key={p} className="text-theme-text-muted px-2">...</span>;
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${p === pagination.page ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-surface border border-theme-border text-theme-text-muted hover:text-theme-text hover:bg-theme-bg shadow-sm'}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button 
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface border border-theme-border text-theme-text disabled:opacity-30 hover:bg-theme-bg transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
