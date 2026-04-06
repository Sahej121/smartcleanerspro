'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

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

export default function StoreAdmin({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', role: 'Front Desk', email: '', pin: '' });
  const [staffCredentials, setStaffCredentials] = useState(null);
  const [activeBroadcast, setActiveBroadcast] = useState(null);

  const fetchData = async () => {
    try {
      const [statsRes, broadcastRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/system/broadcast/active')
      ]);
      const [statsData, broadcastData] = await Promise.all([
        statsRes.json(),
        broadcastRes.json().catch(() => null)
      ]);
      setStats(statsData);
      setActiveBroadcast(broadcastData);
    } catch (error) {
      console.error('Failed to fetch store dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Initializing Atelier POS...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-4 lg:space-y-8">
      {/* Broadcast Banner */}
      {activeBroadcast && (
        <div className={`p-4 rounded-xl shadow-lg border animate-fade-in flex items-center gap-4 ${
          activeBroadcast.severity === 'error' ? 'bg-red-600 text-white border-red-700 shadow-red-900/20' :
          activeBroadcast.severity === 'warning' ? 'bg-amber-500 text-white border-amber-600 shadow-amber-900/20' :
          'bg-emerald-600 text-white border-emerald-700 shadow-emerald-900/20'
        }`}>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
               {activeBroadcast.severity === 'error' ? 'emergency_home' : 'campaign'}
            </span>
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-0.5">
               {activeBroadcast.severity === 'error' ? 'Global Emergency Transmit' : 'System Broadcast'} • {new Date(activeBroadcast.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </h4>
            <p className="font-bold text-sm tracking-tight leading-snug">{activeBroadcast.description.replace(/^Admin Broadcast:\s*/i, '')}</p>
          </div>
          <button onClick={() => setActiveBroadcast(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all shrink-0">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Greeting Section */}
      <div className="flex justify-between items-start animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1 font-headline">
            {getGreeting()}, Atelier
          </h1>
          <p className="text-on-surface-variant font-medium">Here's how your shop is performing today.</p>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          <Link href="/orders/new?type=pickup" className="flex items-center justify-center gap-2 px-6 py-2.5 premium-gradient text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-900/10 active:scale-95 shimmer-btn transition-all">
            <span className="material-symbols-outlined text-lg">add</span>
            New Pickup
          </Link>
          <button className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest font-bold text-sm text-on-surface hover:bg-surface-container-low hover:shadow-md transition-all">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            Last 24 Hours
          </button>
          <button className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest font-bold text-sm text-on-surface hover:bg-surface-container-low hover:shadow-md transition-all">
            <span className="material-symbols-outlined text-lg">download</span>
            Report
          </button>
        </div>
      </div>

      {/* Hero Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Large Stats Card — Revenue */}
        <div className="md:col-span-2 lg:col-span-2 p-6 rounded-3xl bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden group border border-outline-variant/10 card-hover animate-fade-in-up stagger-1">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-on-surface-variant mb-1">Daily Revenue</h3>
                <p className="text-4xl font-extrabold tracking-tighter text-on-surface font-headline animate-count-up">
                  {formatCurrency(stats?.todayRevenue || 0)}
                </p>
              </div>
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                <span className="material-symbols-outlined text-xs">trending_up</span> +12.4%
              </span>
            </div>
            <div className="flex items-end gap-1.5 h-24">
              {[0.5, 0.65, 0.45, 0.75, 1.0, 0.65, 0.85].map((h, i) => (
                <div 
                  key={i} 
                  className={`flex-1 rounded-t-xl transition-all duration-500 bar-animate ${i === 6 ? 'primary-gradient shadow-lg shadow-primary/20' : 'bg-primary/10 group-hover:bg-primary/15'}`}
                  style={{ height: `${h * 100}%`, animationDelay: `${i * 100}ms` }}
                ></div>
              ))}
            </div>
          </div>
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-40 group-hover:opacity-60 group-hover:scale-125 transition-all duration-700"></div>
        </div>

        {/* Total Orders */}
        <div className="p-6 rounded-3xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-outline-variant/10 group hover:border-primary/20 transition-all card-hover animate-fade-in-up stagger-2">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-100 transition-all duration-300">
              <span className="material-symbols-outlined text-2xl">shopping_basket</span>
            </div>
            <span className="text-xs font-bold text-slate-400">Same as yesterday</span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-on-surface-variant mb-1">Total Orders</h3>
            <p className="text-3xl font-extrabold tracking-tighter text-on-surface font-headline">
              <AnimatedCounter value={stats?.todayOrders || 0} />
            </p>
          </div>
        </div>

        {/* Ready for Pickup — Green Hero Card */}
        <div className="p-6 rounded-3xl primary-gradient text-white shadow-xl shadow-emerald-900/10 flex flex-col justify-between relative overflow-hidden group card-hover animate-fade-in-up stagger-3">
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <h3 className="text-sm font-bold text-white/80 mb-1">Ready for Pickup</h3>
            <p className="text-4xl font-extrabold tracking-tighter text-white font-headline">
              <AnimatedCounter value={stats?.pendingPickup || 0} />
            </p>
          </div>
          <button className="mt-4 py-2 w-full bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all backdrop-blur-sm relative z-10 active:scale-95 flex items-center justify-center gap-1">
            Notify Customers <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>

        {/* Avg. Turnaround */}
        <div className="p-6 rounded-3xl bg-surface-container-lowest shadow-sm flex flex-col justify-between border border-outline-variant/10 group hover:border-primary/20 transition-all card-hover animate-fade-in-up stagger-4 lg:col-span-1 hidden lg:flex">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-100 transition-all duration-300">
              <span className="material-symbols-outlined text-2xl">timer</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-on-surface-variant mb-1">Avg. Turnaround</h3>
            <p className="text-3xl font-extrabold tracking-tighter text-on-surface font-headline">18.2 <span className="text-lg">hrs</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Section */}
        <div className="lg:col-span-2 space-y-6 animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-extrabold tracking-tight text-on-surface font-headline">Recent Orders</h2>
            <Link href="/orders" className="text-primary text-sm font-bold hover:underline tracking-tight flex items-center gap-1 group">
              View All Records
              <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>
          </div>
          <div className="bg-surface-container-lowest rounded-3xl shadow-sm overflow-x-auto border border-outline-variant/10">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-on-surface-variant">Order ID</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-on-surface-variant">Customer</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-on-surface-variant">Garment Type</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-on-surface-variant">Status</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-on-surface-variant text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {stats?.recentOrders?.map((order, idx) => (
                  <tr key={order.id} className="hover:bg-emerald-50/30 transition-all group cursor-pointer row-enter" style={{ animationDelay: `${idx * 80}ms` }}>
                    <td className="px-6 py-5">
                      <Link href={`/orders/${order.id}`} className="text-sm font-bold text-emerald-800 group-hover:text-emerald-600 transition-colors">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center text-[10px] font-bold text-emerald-700 uppercase shadow-inner">
                          {order.customer_name?.charAt(0) || 'W'}
                        </div>
                        <span className="text-sm font-medium text-on-surface">{order.customer_name || 'Walk-in'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">
                      {order.item_count || 1}x Garment
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                        order.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 
                        order.status === 'processing' ? 'bg-amber-100 text-amber-700' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-sm text-on-surface whitespace-nowrap">
                      {formatCurrency(order.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: Staff Leaderboard & Daily Goal */}
        <div className="space-y-6">
          {/* Staff Leaderboard */}
          <section className="animate-fade-in-up stagger-5">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-lg font-extrabold tracking-tight text-on-surface font-headline">Staff Leaderboard</h2>
              <button 
                onClick={() => setShowAddStaffModal(true)}
                className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                Add Staff
              </button>
            </div>
            <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/10 p-6 space-y-5">
              {[
                { name: 'Sarah Connor', role: 'Head Presser', score: 98 },
                { name: 'David Chen', role: 'Quality Control', score: 94 },
                { name: 'Elena Rodriguez', role: 'Front Desk', score: 92 },
              ].map((staff, i) => (
                <div key={i} className="flex items-center gap-4 group animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center text-emerald-700 font-bold text-xs shadow-inner">
                    {staff.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-on-surface">{staff.name}</p>
                    <p className="text-[10px] text-on-surface-variant">{staff.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-600">{staff.score}%</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Efficiency</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Daily Order Goal */}
          <section className="animate-fade-in-up stagger-6">
            <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/10 card-hover">
              <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Daily Order Goal</p>
                <span className="text-2xl font-black text-on-surface font-headline">71%</span>
              </div>
              <div className="w-full bg-white/50 h-2.5 rounded-full overflow-hidden mb-3">
                <div className="primary-gradient h-full rounded-full shadow-[0_0_8px_rgba(34,197,94,0.3)] progress-animate" style={{ width: '71%' }}></div>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium">
                {stats?.todayOrders || 0}/200 Orders processed today. Keep pushing!
              </p>
            </div>
          </section>

          {/* Inventory Status */}
          <section className="animate-fade-in-up stagger-7">
            <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/10 card-hover">
              <div className="flex justify-between items-start mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Stock Integrity</p>
                <span className={`text-2xl font-black font-headline ${(stats?.stockHealth || 0) < 60 ? 'text-amber-600' : 'text-emerald-600'}`}>{stats?.stockHealth ?? 0}%</span>
              </div>
              <div className="w-full bg-white/50 h-2.5 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full shadow-sm progress-animate ${(stats?.stockHealth || 0) < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${stats?.stockHealth ?? 0}%` }}></div>
              </div>
              <p className={`text-[11px] font-medium flex items-center gap-1 ${(stats?.inventoryAlerts || 0) > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                <span className="material-symbols-outlined text-[14px]">{(stats?.inventoryAlerts || 0) > 0 ? 'warning' : 'check_circle'}</span>
                {(stats?.inventoryAlerts || 0) > 0 ? `${stats.lowStockItems} running low.` : 'All stock levels healthy.'}
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up stagger-7">
        {/* Solvent Levels */}
        <div className="p-6 rounded-3xl bg-surface-container-lowest shadow-sm border border-outline-variant/10 card-hover">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">water_drop</span>
            </div>
            <h3 className="text-sm font-bold text-on-surface">Solvent Levels</h3>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-on-surface font-headline">32%</p>
              <p className="text-xs font-bold text-amber-600 mt-1">Refill Soon</p>
            </div>
            <div className="flex items-end gap-1 h-12">
              {[0.6, 0.4, 0.3].map((h, i) => (
                <div key={i} className="w-3 bg-primary/20 rounded-t-md" style={{ height: `${h * 100}%` }}></div>
              ))}
            </div>
          </div>
        </div>

        {/* Packaging Stock */}
        <div className="p-6 rounded-3xl bg-surface-container-lowest shadow-sm border border-outline-variant/10 card-hover">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <h3 className="text-sm font-bold text-on-surface">Packaging Stock</h3>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-on-surface font-headline">High</p>
              <p className="text-xs font-bold text-emerald-600 mt-1">Next delivery 14 Oct</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          </div>
        </div>

        {/* Energy Efficiency */}
        <div className="p-6 rounded-3xl bg-surface-container-lowest shadow-sm border border-outline-variant/10 card-hover">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">bolt</span>
            </div>
            <h3 className="text-sm font-bold text-on-surface">Energy Efficiency</h3>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-on-surface font-headline">A+</p>
              <p className="text-xs font-bold text-emerald-600 mt-1">Eco-mode active</p>
            </div>
            <div className="flex items-end gap-1 h-12">
              {[0.6, 0.8, 1.0].map((h, i) => (
                <div key={i} className="w-3 bg-primary/30 rounded-t-md" style={{ height: `${h * 100}%` }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between pt-6 border-t border-emerald-100/10">
        <p className="text-xs text-slate-400 font-medium">© 2024 CleanFlow Enterprise. All systems operational.</p>
        <div className="flex gap-4">
          <a className="text-xs font-bold text-slate-500 hover:text-primary transition-colors" href="#">Privacy</a>
          <a className="text-xs font-bold text-slate-500 hover:text-primary transition-colors" href="#">API Docs</a>
        </div>
      </footer>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-3xl w-full max-w-md shadow-2xl border border-outline-variant/20 overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <span className="material-symbols-outlined">person_add</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-on-surface text-lg">Invite Staff Member</h3>
                  <p className="text-xs font-medium text-slate-500">Provide their details to generate a PIN.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddStaffModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200/50 text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 block">Full Name</label>
                <input 
                  type="text" 
                  autoFocus
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-300" 
                  placeholder="e.g. Jane Doe"
                  value={newStaff.name}
                  onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 block">Email Address</label>
                <input 
                  type="email" 
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-300" 
                  placeholder="name@cleanflow.com"
                  value={newStaff.email}
                  onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 block">Role</label>
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all appearance-none"
                    value={newStaff.role}
                    onChange={e => setNewStaff({...newStaff, role: e.target.value})}
                  >
                    <option value="Front Desk">Front Desk</option>
                    <option value="Presser">Presser</option>
                    <option value="Quality Control">Quality Control</option>
                    <option value="Delivery Manager">Delivery Manager</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 block">Login PIN</label>
                  <input 
                    type="text" 
                    maxLength={4}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-black text-center tracking-widest focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-mono" 
                    placeholder="1234"
                    value={newStaff.pin}
                    onChange={e => setNewStaff({...newStaff, pin: e.target.value.replace(/\D/g,'')})}
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button 
                onClick={() => setShowAddStaffModal(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200/50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/staff', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: newStaff.name, email: newStaff.email, role: 'staff', pin: newStaff.pin }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setStaffCredentials({ name: data.name, email: data.admin_email || data.email, pin: data.pin });
                      setShowAddStaffModal(false);
                    } else {
                      alert(`Error: ${data.error}`);
                    }
                  } catch (err) {
                    alert('Failed to invite staff member.');
                  }
                  setNewStaff({ name: '', role: 'Front Desk', email: '', pin: '' });
                }}
                disabled={!newStaff.name || newStaff.pin.length < 4}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white primary-gradient shadow-md shadow-primary/20 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Credentials Success Modal */}
      {staffCredentials && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-md shadow-2xl border border-emerald-500/20 overflow-hidden animate-fade-in-up relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -translate-y-16 translate-x-16 opacity-60"></div>
             
             <div className="p-8 relative z-10 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-inner animate-bounce-subtle">
                   <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock_open</span>
                </div>
                
                <h2 className="text-2xl font-black text-on-surface font-headline uppercase tracking-tighter mb-2">Staff Registered!</h2>
                <p className="text-sm font-medium text-slate-500 mb-8 italic">Access PIN confirmed for <span className="text-emerald-700 font-bold">{staffCredentials.name}</span></p>
                
                <div className="space-y-4 mb-8 text-left">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Login Email/ID</p>
                    <p className="text-sm font-bold text-on-surface">{staffCredentials.email || 'Assigned to Store'}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 group">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Assigned Access PIN</p>
                    <div className="flex justify-between items-center">
                      <p className="text-2xl font-black text-emerald-700 tracking-[0.5em]">{staffCredentials.pin}</p>
                      <button className="text-emerald-400 hover:text-emerald-600 transition-colors">
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setStaffCredentials(null)}
                  className="w-full py-4 primary-gradient text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  Confirm & Close
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
