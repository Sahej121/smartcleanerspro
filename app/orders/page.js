'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const STATUS_TABS = ['all', 'received', 'processing', 'ready', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    fetchOrders();
  }, [activeTab, search]);

  const fetchOrders = () => {
    const params = new URLSearchParams();
    if (activeTab !== 'all') params.set('status', activeTab);
    if (search) params.set('search', search);

    fetch(`/api/orders?${params}`)
      .then(r => r.json())
      .then(data => { setOrders(data); setLoading(false); });
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-6 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">Order Registry</h1>
          <p className="text-on-surface-variant font-medium">Internal ledger of all dry cleaning transactions and logistics.</p>
        </div>
        <Link href="/orders/new" className="px-6 py-3 rounded-2xl premium-gradient text-white font-black text-sm shadow-xl shadow-emerald-900/10 active:scale-95 transition-all flex items-center gap-2 shimmer-btn">
          <span className="material-symbols-outlined text-lg">add_circle</span>
          New Pickup
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between animate-fade-in-up stagger-1">
        <div className="flex gap-1.5 p-1.5 bg-slate-100/50 rounded-2xl overflow-x-auto no-scrollbar max-w-full">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                activeTab === tab 
                  ? 'bg-white shadow-md text-emerald-800 scale-[1.02]' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80 group">
          <span className={`material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-sm transition-colors duration-300 ${search ? 'text-primary' : 'text-slate-400 group-focus-within:text-primary'}`}>search</span>
          <input
            className="w-full bg-surface-container-low border border-transparent rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold placeholder:text-slate-400 outline-none transition-all duration-300 focus:ring-2 focus:ring-emerald-500/10 focus:border-primary/30 focus:bg-white focus:shadow-lg focus:shadow-primary/5"
            placeholder="Search Registry..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Registry Table */}
      <div className="glass-panel rounded-[2.5rem] border border-emerald-50/50 shadow-sm animate-fade-in-up stagger-2 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                <th className="px-8 py-5">Order ID</th>
                <th className="px-8 py-5">Customer</th>
                <th className="px-8 py-5">Logistics Status</th>
                <th className="px-8 py-5">Payment</th>
                <th className="px-8 py-5">Total Amount</th>
                <th className="px-8 py-5">Created</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center opacity-30 animate-fade-in-up">
                      <span className="material-symbols-outlined text-5xl mb-4">inventory</span>
                      <p className="text-xs font-black uppercase tracking-widest">No entries found in registry</p>
                    </div>
                  </td>
                </tr>
              ) : orders.map((order, idx) => (
                <tr key={order.id} className="group hover:bg-emerald-50/30 transition-all cursor-pointer row-enter" style={{ animationDelay: `${idx * 60}ms` }}>
                  <td className="px-8 py-6">
                    <Link href={`/orders/${order.id}`} className="text-sm font-black text-emerald-800 hover:text-emerald-600 transition-colors">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center text-[10px] font-black text-emerald-700 uppercase shadow-inner">
                        {order.customer_name?.charAt(0) || 'W'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">{order.customer_name || 'Walk-in'}</p>
                        <p className="text-[9px] text-on-surface-variant font-bold uppercase">{order.customer_phone || 'Instant'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight transition-shadow hover:shadow-md ${
                      order.status === 'ready' ? 'bg-emerald-100 text-emerald-800' : 
                      order.status === 'processing' ? 'bg-amber-100 text-amber-800' : 
                      order.status === 'received' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'delivered' ? 'bg-slate-100 text-slate-600' :
                      'bg-red-100 text-red-800'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        order.status === 'ready' ? 'bg-emerald-500' : 
                        order.status === 'processing' ? 'bg-amber-500' : 
                        order.status === 'received' ? 'bg-blue-500' :
                        'bg-slate-400'
                      }`}></span>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${
                      order.payment_status === 'paid' ? 'border-emerald-200 text-emerald-700 bg-emerald-50/50' : 'border-amber-200 text-amber-700 bg-amber-50/50'
                    }`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-on-surface">{formatCurrency(order.total_amount)}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{order.item_count} garments</p>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-400 uppercase">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Link href={`/orders/${order.id}`} className="p-2 text-slate-300 hover:text-emerald-700 transition-all inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-emerald-50 group-hover:translate-x-1">
                      <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </Link>
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
