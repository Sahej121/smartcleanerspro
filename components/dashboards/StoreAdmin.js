'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency-utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';

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
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', role: 'Front Desk', email: '', pin: '' });
  const [staffCredentials, setStaffCredentials] = useState(null);
  const [activeBroadcast, setActiveBroadcast] = useState(null);

  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatMessages(prev => [...prev, { text: msg, isUser: true }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, { text: data.reply, isUser: false }]);
      } else {
        setChatMessages(prev => [...prev, { text: "Sorry, I couldn't process that request.", isUser: false }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { text: "Connection error.", isUser: false }]);
    }
    setChatLoading(false);
  };

  const fetchData = async () => {
    try {
      const [statsRes, broadcastRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/system/broadcast/active')
      ]);
      if (!statsRes.ok) { console.error('[Dashboard] /api/stats returned', statsRes.status); return; }
      const statsData = await statsRes.json();
      const broadcastData = broadcastRes.ok ? await broadcastRes.json().catch(() => null) : null;
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



  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting_morning');
    if (hour < 17) return t('greeting_afternoon');
    return t('greeting_evening');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-theme-border border-t-emerald-600 animate-spin" />
        <p className="text-theme-text-muted font-medium animate-pulse">{t('init_pos')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-10 space-y-10 lg:space-y-12 animate-fade-in max-w-[1600px] mx-auto">
      {/* Broadcast Banner */}
      {activeBroadcast && (
        <div className={`p-5 rounded-2xl shadow-lg border animate-fade-in flex items-center gap-5 backdrop-blur-md ${
          activeBroadcast.severity === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
          activeBroadcast.severity === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
          'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
        }`}>
          <div className="w-12 h-12 rounded-xl bg-current/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
               {activeBroadcast.severity === 'error' ? 'emergency_home' : 'campaign'}
            </span>
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1 flex items-center gap-2">
               {activeBroadcast.severity === 'error' ? 'Global Emergency Transmit' : t('system_broadcast')} 
               <span className="w-1 h-1 rounded-full bg-current opacity-30"></span>
               {new Date(activeBroadcast.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </h4>
            <p className="font-bold text-sm tracking-tight leading-snug text-theme-text">{activeBroadcast.description.replace(/^Admin Broadcast:\s*/i, '')}</p>
          </div>
          <button onClick={() => setActiveBroadcast(null)} className="p-2 rounded-full hover:bg-current/10 flex items-center justify-center transition-all shrink-0 text-theme-text-muted">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Greeting Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] px-3 py-1 bg-primary/10 rounded-full border border-primary/20">{t('op_pulse')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-theme-text italic leading-none">
            {getGreeting()}, <span className="inline-block px-3 text-transparent bg-clip-text bg-gradient-to-r from-theme-text to-theme-text-muted">{user?.name?.split(' ')[0] || 'Atelier'}</span>
          </h1>
          <p className="text-theme-text-muted font-bold tracking-tight text-sm mt-2">{t('dash_tagline')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/orders/new?type=pickup" className="flex items-center justify-center gap-3 px-8 py-4 bg-theme-text text-theme-bg rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-theme-text/10 active:scale-95 transition-all hover:-translate-y-1">
            <span className="material-symbols-outlined text-lg">add_circle</span>
            {t('nav_new_order')}
          </Link>
          <button className="flex items-center gap-3 px-6 py-4 rounded-2xl border border-theme-border bg-theme-surface/30 backdrop-blur-md font-black text-[11px] uppercase tracking-widest text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-container transition-all">
            <span className="material-symbols-outlined text-lg">tune</span>
            {t('filters')}
          </button>
        </div>
      </div>

      {/* Hero Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Large Stats Card — Revenue */}
        <div className="md:col-span-2 p-8 rounded-[2.5rem] glass-card-matte relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:bg-primary/10 transition-colors duration-700"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-[10px] font-black uppercase text-theme-text-muted tracking-[0.3em] mb-2">{t('revenue_matrix')}</p>
                <p className="text-5xl font-black tracking-tighter text-theme-text font-headline animate-count-up italic">
                  {formatCurrency(stats?.todayRevenue || 0, user?.country)}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-sm">trending_up</span> +12.4%
                </span>
                <span className="text-[9px] font-bold text-theme-text-muted">{t('vs_prev_session')}</span>
              </div>
            </div>
            
            <div className="flex items-end gap-2 h-20">
              {[0.4, 0.6, 0.5, 0.8, 0.9, 0.7, 1.0].map((h, i) => (
                <div 
                  key={i} 
                  className={`flex-1 rounded-t-xl transition-all duration-700 bar-animate ${i === 6 ? 'bg-primary shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white/5 opacity-50 group-hover:opacity-100'}`}
                  style={{ height: `${h * 100}%`, animationDelay: `${i * 100}ms` }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-8 rounded-[2.5rem] glass-card-matte group flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-theme-surface-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 border border-theme-border">
              <span className="material-symbols-outlined text-3xl">shopping_basket</span>
            </div>
          </div>
          <div className="mt-8 relative z-10">
            <p className="text-[10px] font-black uppercase text-theme-text-muted tracking-[0.3em] mb-1">{t('analytics_throughput')}</p>
            <p className="text-4xl font-black tracking-tighter text-theme-text font-headline italic">
              <AnimatedCounter value={stats?.todayOrders || 0} />
            </p>
            <p className="text-[9px] font-bold text-emerald-500 mt-2 uppercase tracking-widest">{t('awaiting_induction')}: 4</p>
          </div>
        </div>

        {/* Ready for Pickup Card */}
        <div className="p-8 rounded-[2.5rem] glass-card-matte group flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:rotate-12 transition-transform duration-500 border border-emerald-500/20">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            {stats?.pendingPickup > 0 && <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]"></span>}
          </div>
          <div className="mt-8 relative z-10">
            <p className="text-[10px] font-black uppercase text-theme-text-muted tracking-[0.3em] mb-1">{t('ready_for_rack')}</p>
            <p className="text-4xl font-black tracking-tighter text-theme-text font-headline italic">
              <AnimatedCounter value={stats?.pendingPickup || 0} />
            </p>
            <button className="mt-4 flex items-center gap-2 text-primary hover:text-emerald-400 text-[10px] font-black uppercase tracking-widest transition-colors">
              {t('notify_all')} <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Section */}
        <div className="lg:col-span-2 space-y-6 animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black tracking-tighter text-theme-text font-headline italic">{t('recent_deliveries')}</h2>
            <Link href="/orders" className="text-primary text-[10px] font-black uppercase tracking-widest hover:text-emerald-400 transition-colors flex items-center gap-2 group">
              {t('audit_logs')}
              <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>
          </div>
          <div className="glass-panel rounded-[2.5rem] overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-theme-surface-container/30 border-b border-theme-border">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted">{t('order_id')}</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted">{t('entity')}</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted">{t('allocation')}</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted">{t('vector')}</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted text-right">{t('valuation')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border">
                  {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="opacity-20">
                        <td className="px-8 py-6"><div className="h-4 w-24 bg-theme-surface-container rounded animate-pulse"></div></td>
                        <td className="px-8 py-6"><div className="h-4 w-32 bg-theme-surface-container rounded animate-pulse"></div></td>
                        <td className="px-8 py-6"><div className="h-4 w-20 bg-theme-surface-container rounded animate-pulse"></div></td>
                        <td className="px-8 py-6"><div className="h-4 w-16 bg-theme-surface-container rounded animate-pulse"></div></td>
                        <td className="px-8 py-6 text-right"><div className="h-4 w-16 bg-theme-surface-container rounded animate-pulse ml-auto"></div></td>
                      </tr>
                    ))
                  ) : (
                    stats.recentOrders.map((order, idx) => (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition-all group cursor-pointer row-enter" style={{ animationDelay: `${idx * 50}ms` }}>
                        <td className="px-8 py-6">
                          <Link href={`/orders/${order.id}`} className="text-[11px] font-black text-theme-text tracking-widest group-hover:text-primary transition-colors">
                            {order.order_number}
                          </Link>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-theme-surface-container border border-theme-border flex items-center justify-center text-[10px] font-black text-theme-text-muted uppercase shadow-inner group-hover:border-primary/30 group-hover:text-primary transition-all">
                              {order.customer_name?.charAt(0) || 'W'}
                            </div>
                            <span className="text-[11px] font-bold text-theme-text-muted group-hover:text-theme-text transition-colors">{order.customer_name || t('walkin')}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-[10px] font-black text-theme-text-muted uppercase tracking-widest">
                          {order.item_count || 1} {t('items')}
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border ${
                            order.status === 'ready' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                            order.status === 'processing' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right font-black text-[11px] text-theme-text tracking-tight">
                          {formatCurrency(order.total_amount, user?.country)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="lg:hidden flex flex-col divide-y divide-theme-border">
              {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
                <div className="p-8 text-center text-theme-text-muted text-[10px] uppercase font-black tracking-widest opacity-30">{t('no_logs_found')}</div>
              ) : (
                stats.recentOrders.map((order, idx) => (
                  <Link 
                    key={order.id} 
                    href={`/orders/${order.id}`}
                    className="p-5 active:bg-white/5 transition-all flex justify-between items-center group"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-theme-surface-container border border-theme-border flex items-center justify-center text-primary font-black text-xs">
                         {order.customer_name?.charAt(0) || 'W'}
                       </div>
                       <div>
                         <p className="text-[11px] font-black text-theme-text">{order.order_number}</p>
                         <p className="text-[10px] text-theme-text-muted font-bold truncate max-w-[120px]">{order.customer_name || t('walkin')}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[11px] font-black text-theme-text">{formatCurrency(order.total_amount, user?.country)}</p>
                       <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border ${
                        order.status === 'ready' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                        order.status === 'processing' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Staff Leaderboard & Daily Goal */}
        <div className="space-y-8">
          {/* Staff Leaderboard */}
          <section className="animate-fade-in-up stagger-5">
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-xl font-black tracking-tighter text-theme-text font-headline italic">{t('performance')}</h2>
              <button 
                onClick={() => setShowAddStaffModal(true)}
                className="w-10 h-10 rounded-xl bg-theme-surface-container border border-theme-border hover:border-primary/50 text-primary flex items-center justify-center transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
              </button>
            </div>
            <div className="glass-panel rounded-[2.5rem] p-8 space-y-6">
              {[
                { name: 'Sarah Connor', role: 'Head Presser', score: 98, trend: 'up' },
                { name: 'David Chen', role: 'Quality Control', score: 94, trend: 'stable' },
                { name: 'Elena Rodriguez', role: 'Front Desk', score: 92, trend: 'up' },
              ].map((staff, i) => (
                <div key={i} className="flex items-center gap-5 group animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-theme-surface-container border border-theme-border flex items-center justify-center text-primary font-black text-[11px] shadow-inner group-hover:border-primary/50 transition-all duration-500">
                      {staff.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {staff.trend === 'up' && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-theme-surface shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-theme-text group-hover:text-primary transition-colors tracking-tight">{staff.name}</p>
                    <p className="text-[10px] text-theme-text-muted font-bold uppercase tracking-widest opacity-60">{staff.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-theme-text italic leading-none">{staff.score}%</p>
                    <p className="text-[9px] font-black text-emerald-500/50 uppercase tracking-widest mt-1">{t('analytics_efficiency')}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Daily Order Goal */}
          <section className="animate-fade-in-up stagger-6">
            <div className="p-8 rounded-[2.5rem] glass-card-matte relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted mb-1">{t('target_achievement')}</p>
                   <h3 className="text-3xl font-black text-theme-text font-headline italic">71%</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <span className="material-symbols-outlined text-xl">flag</span>
                </div>
              </div>
              <div className="w-full bg-theme-surface-container h-2.5 rounded-full overflow-hidden mb-4 border border-theme-border">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] progress-animate relative" style={{ width: '71%' }}>
                </div>
              </div>
              <p className="text-[11px] text-theme-text-muted font-bold tracking-tight">
                <span className="text-theme-text">{stats?.todayOrders || 0}</span> / 200 {t('orders_processed_today')}
              </p>
            </div>
          </section>

          {/* Inventory Status */}
          <section className="animate-fade-in-up stagger-7">
            <div className="p-8 rounded-[2.5rem] glass-card-matte relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted mb-1">{t('stock_integrity')}</p>
                   <h3 className={`text-3xl font-black font-headline italic ${(stats?.stockHealth || 0) < 60 ? 'text-amber-500' : 'text-emerald-500'}`}>{stats?.stockHealth ?? 0}%</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-theme-surface-container flex items-center justify-center text-theme-text-muted border border-theme-border">
                  <span className="material-symbols-outlined text-xl">{(stats?.inventoryAlerts || 0) > 0 ? 'inventory' : 'verified'}</span>
                </div>
              </div>
              <div className="w-full bg-theme-surface-container h-2.5 rounded-full overflow-hidden mb-4 border border-theme-border">
                <div className={`h-full rounded-full shadow-sm progress-animate ${(stats?.stockHealth || 0) < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${stats?.stockHealth ?? 0}%` }}></div>
              </div>
              <p className={`text-[11px] font-bold tracking-tight ${(stats?.inventoryAlerts || 0) > 0 ? 'text-amber-500' : 'text-theme-text-muted'}`}>
                {(stats?.inventoryAlerts || 0) > 0 ? `${stats.lowStockItems} ${t('sectors_replenishment')}` : t('stock_stable')}
              </p>
            </div>
          </section>

          {/* Predictive Insights */}
          <section className="animate-fade-in-up stagger-8">
            <div className="p-8 rounded-[2.5rem] glass-card-matte relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted mb-1">Predictive Insights</p>
                    <h3 className="text-2xl font-black text-theme-text font-headline italic">Peak: {stats?.predictiveInsight || 'Pending'}</h3>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">insights</span>
                 </div>
              </div>
              <p className="text-[11px] font-bold tracking-tight text-theme-text-muted">
                 Historical data predicts high volume on <span className="text-purple-500 font-black">{stats?.predictiveInsight || '...'}</span>. Optimize staff scheduling to prevent bottlenecks.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up stagger-7">
        {/* Solvent Levels */}
        <div className="p-8 rounded-[2.5rem] glass-card-matte relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <div className="w-14 h-14 rounded-2xl bg-theme-surface-container border border-theme-border flex items-center justify-center text-primary group-hover:bg-primary/5 transition-all">
              <span className="material-symbols-outlined text-3xl">water_drop</span>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted mb-1">{t('solvent_integrity')}</p>
               <h3 className="text-3xl font-black text-theme-text font-headline italic">32%</h3>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.6)]"></span>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{t('low_level_alert')}</p>
            </div>
            <div className="flex items-end gap-1.5 h-12">
              {[0.6, 0.45, 0.32].map((h, i) => (
                <div key={i} className={`w-3 rounded-t-lg transition-all duration-1000 ${i === 2 ? 'bg-amber-500/40' : 'bg-primary/10'}`} style={{ height: `${h * 100}%` }}></div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500/20">
             <div className="h-full bg-amber-500 w-[32%] shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
          </div>
        </div>

        {/* Packaging Stock */}
        <div className="p-8 rounded-[2.5rem] glass-card-matte relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <div className="w-14 h-14 rounded-2xl bg-theme-surface-container border border-theme-border flex items-center justify-center text-primary group-hover:bg-primary/5 transition-all">
              <span className="material-symbols-outlined text-3xl">inventory_2</span>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted mb-1">{t('packaging_reserve')}</p>
               <h3 className="text-3xl font-black text-emerald-500 font-headline italic">HIGH</h3>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t('supply_validated')}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
            </div>
          </div>
          <p className="mt-4 text-[9px] font-black text-theme-text-muted uppercase tracking-widest opacity-60">Replenishment ETA: 14 OCT 2024</p>
        </div>

        {/* Energy Efficiency */}
        <div className="p-8 rounded-[2.5rem] glass-card-matte relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <div className="w-14 h-14 rounded-2xl bg-theme-surface-container border border-theme-border flex items-center justify-center text-primary group-hover:bg-primary/5 transition-all">
              <span className="material-symbols-outlined text-3xl">bolt</span>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted mb-1">{t('energy_efficiency')}</p>
               <h3 className="text-3xl font-black text-theme-text font-headline italic">A+</h3>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t('eco_active')}</p>
            </div>
            <div className="flex items-end gap-1.5 h-12">
              {[0.4, 0.7, 0.9, 1.0].map((h, i) => (
                <div key={i} className="w-2.5 bg-primary/20 rounded-full" style={{ height: `${h * 100}%` }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex flex-col md:flex-row items-center justify-between pt-12 border-t border-theme-border gap-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-theme-surface-container border border-theme-border flex items-center justify-center text-theme-text-muted">
            <span className="material-symbols-outlined text-sm">terminal</span>
          </div>
          <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.3em]">© 2024 {typeof window !== 'undefined' ? (localStorage.getItem('cleanflow_system_name') || 'DrycleanersFlow') : 'DrycleanersFlow'} Enterprise • v2.4.0-matrix</p>
        </div>
        <div className="flex items-center gap-8">
          <a className="text-[10px] font-black text-theme-text-muted hover:text-primary uppercase tracking-widest transition-colors flex items-center gap-2" href="#">
            <span className="w-1 h-1 rounded-full bg-theme-text-muted"></span>
            Privacy Protocol
          </a>
          <a className="text-[10px] font-black text-theme-text-muted hover:text-primary uppercase tracking-widest transition-colors flex items-center gap-2" href="#">
            <span className="w-1 h-1 rounded-full bg-theme-text-muted"></span>
            System API
          </a>
        </div>
      </footer>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-theme-bg/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel bg-theme-surface rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-8 border-b border-theme-border flex justify-between items-center bg-theme-surface-container/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <span className="material-symbols-outlined text-2xl">person_add</span>
                </div>
                <div>
                  <h3 className="font-black text-theme-text text-xl tracking-tighter italic">{t('provision_staff')}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">{t('provision_desc')}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddStaffModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-theme-text-muted transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted mb-2 block">{t('op_identity')}</label>
                <input 
                  type="text" 
                  autoFocus
                  className="w-full bg-theme-surface-container border border-theme-border rounded-2xl p-4 text-sm font-bold text-theme-text focus:border-primary/50 outline-none transition-all placeholder:text-theme-text-muted/30" 
                  placeholder="e.g. Sarah Connor"
                  value={newStaff.name}
                  onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted mb-2 block">{t('enterprise_mailbox')}</label>
                <input 
                  type="email" 
                  className="w-full bg-theme-surface-container border border-theme-border rounded-2xl p-4 text-sm font-bold text-theme-text focus:border-primary/50 outline-none transition-all placeholder:text-theme-text-muted/30" 
                  placeholder="operator@cleanflow.ai"
                  value={newStaff.email}
                  onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted mb-2 block">{t('sector_assignment')}</label>
                  <select 
                    className="w-full bg-theme-surface-container border border-theme-border rounded-2xl p-4 text-sm font-bold text-theme-text focus:border-primary/50 outline-none transition-all appearance-none"
                    value={newStaff.role}
                    onChange={e => setNewStaff({...newStaff, role: e.target.value})}
                  >
                    <option value="Front Desk">Logistics Desk</option>
                    <option value="Presser">Production Press</option>
                    <option value="Quality Control">Integrity Check</option>
                    <option value="Delivery Manager">Vector Fleet</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted mb-2 block">{t('security_pin')}</label>
                  <input 
                    type="text" 
                    maxLength={4}
                    className="w-full bg-theme-surface-container border border-theme-border rounded-2xl p-4 text-sm font-black text-theme-text text-center tracking-[0.5em] focus:border-primary/50 outline-none transition-all font-mono" 
                    placeholder="0000"
                    value={newStaff.pin}
                    onChange={e => setNewStaff({...newStaff, pin: e.target.value.replace(/\D/g,'')})}
                  />
                </div>
              </div>
            </div>
            
            <div className="p-8 border-t border-theme-border flex justify-end gap-4 bg-theme-surface-container/30">
              <button 
                onClick={() => setShowAddStaffModal(false)}
                className="px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-theme-text-muted hover:text-theme-text transition-colors"
              >
                {t('abort')}
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
                className="px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-theme-bg bg-theme-text shadow-xl shadow-theme-text/10 disabled:opacity-20 disabled:pointer-events-none active:scale-95 transition-all flex items-center gap-2"
              >
                {t('execute_provision')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Credentials Success Modal */}
      {staffCredentials && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-theme-surface rounded-[2.5rem] w-full max-w-sm shadow-2xl border border-emerald-500/20 overflow-hidden animate-fade-in-up relative">
             <div className="p-6 relative z-10 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-inner animate-bounce-subtle">
                   <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock_open</span>
                </div>
                
                <h2 className="text-2xl font-black text-theme-text font-headline uppercase tracking-tighter mb-2">{t('staff_registered')}</h2>
                <p className="text-sm font-medium text-theme-text-muted mb-8 italic">{t('pin_confirmed')} <span className="text-theme-text font-bold">{staffCredentials.name}</span></p>
                
                <div className="space-y-4 mb-8 text-left">
                  <div className="p-4 bg-theme-surface-container rounded-2xl border border-theme-border group">
                    <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest mb-1">{t('login_id')}</p>
                    <p className="text-sm font-bold text-theme-text">{staffCredentials.email || 'Assigned to Store'}</p>
                  </div>
                  <div className="p-4 bg-theme-surface-container rounded-2xl border border-theme-border group">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">{t('assigned_pin')}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-2xl font-black text-theme-text tracking-[0.5em]">{staffCredentials.pin}</p>
                      <button className="text-emerald-400 hover:text-emerald-600 transition-colors">
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setStaffCredentials(null)}
                  className="w-full py-4 bg-theme-text text-theme-bg rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-sm active:scale-95 transition-all"
                >
                  {t('confirm_close')}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Floating Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        {!showChatbot ? (
          <button 
            onClick={() => setShowChatbot(true)}
            className="w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:bg-emerald-500 transition-all"
          >
            <span className="material-symbols-outlined text-2xl">smart_toy</span>
          </button>
        ) : (
          <div className="w-80 bg-theme-surface border border-theme-border rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-96 animate-scale-in">
            <div className="p-4 bg-emerald-600 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                 <span className="material-symbols-outlined">smart_toy</span>
                 <span className="font-black text-sm tracking-widest uppercase">AI Assistant</span>
              </div>
              <button onClick={() => setShowChatbot(false)} className="hover:text-emerald-200"><span className="material-symbols-outlined text-sm">close</span></button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto no-scrollbar flex flex-col gap-3 bg-theme-surface-container/30">
              {chatMessages.length === 0 && (
                <div className="text-[10px] font-bold text-theme-text-muted text-center mt-4 uppercase tracking-widest">
                  Ask me about historical orders or policies!
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`p-3 rounded-2xl max-w-[85%] text-xs font-medium ${msg.isUser ? 'bg-emerald-600 text-white self-end rounded-tr-sm' : 'bg-theme-surface border border-theme-border text-theme-text self-start rounded-tl-sm'}`}>
                  {msg.text}
                </div>
              ))}
              {chatLoading && (
                <div className="p-3 rounded-2xl max-w-[85%] bg-theme-surface border border-theme-border text-theme-text-muted self-start rounded-tl-sm text-xs flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse delay-150"></div>
                </div>
              )}
            </div>
            <form onSubmit={handleChatSubmit} className="p-3 bg-theme-surface border-t border-theme-border flex gap-2">
               <input 
                 type="text" 
                 value={chatInput} 
                 onChange={e => setChatInput(e.target.value)}
                 placeholder="Ask AI..." 
                 className="flex-1 bg-theme-surface-container border border-theme-border rounded-xl px-3 py-2 text-xs text-theme-text outline-none focus:border-emerald-500"
               />
               <button type="submit" disabled={!chatInput.trim() || chatLoading} className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50">
                 <span className="material-symbols-outlined text-[16px]">send</span>
               </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
