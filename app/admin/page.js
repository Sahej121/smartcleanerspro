'use client';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(val || 0);
  };

  const maxRevenue = Math.max(...(data?.dailyRevenue?.map(d => d.revenue) || [1]), 1);
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-end border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">Business Intelligence</h1>
          <p className="text-on-surface-variant font-medium">Performance analytics and fiscal monitors for Pristine Atelier.</p>
        </div>
        <div className="flex gap-3">
           <div className="flex items-center gap-2 px-4 py-2 bg-theme-surface bg-opacity-80 border border-theme-border rounded-[1rem] text-xs font-bold text-theme-text-muted backdrop-blur-md transition-all hover:bg-theme-surface-container">
             <span className="material-symbols-outlined text-sm">calendar_today</span>
             Last 30 Days
           </div>
           <button className="px-5 py-2 rounded-[1rem] bg-theme-text text-theme-bg font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-lg active:scale-95 transition-all">
             Export Data
           </button>
        </div>
      </div>

      {/* Top Metrics Bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-8 rounded-[2.5rem] bg-surface-container-lowest border border-outline-variant/10 shadow-sm">
           <span className="material-symbols-outlined text-emerald-600 mb-4">payments</span>
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Revenue</p>
           <h2 className="text-3xl font-black text-on-surface font-headline">{formatCurrency(data?.totalRevenue)}</h2>
           <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
             <span className="material-symbols-outlined text-[10px]">trending_up</span> +8.2% vs prev
           </p>
        </div>
        <div className="p-8 rounded-[2.5rem] bg-surface-container-lowest border border-theme-border shadow-sm group hover:-translate-y-1 transition-all">
           <span className="material-symbols-outlined text-blue-500 bg-blue-500/10 p-2 rounded-[1rem] mb-4 group-hover:scale-110 transition-transform">local_mall</span>
           <p className="text-[10px] font-black uppercase text-theme-text-muted tracking-widest mb-1">Order Volume</p>
           <h2 className="text-3xl font-black text-on-surface font-headline">{data?.totalOrders || 0}</h2>
           <p className="text-[10px] text-theme-text-muted font-bold mt-2">Consistent performance</p>
        </div>
        <div className="p-8 rounded-[2.5rem] bg-surface-container-lowest border border-outline-variant/10 shadow-sm">
           <span className="material-symbols-outlined text-purple-500 mb-4">analytics</span>
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Avg. Ticket Size</p>
           <h2 className="text-3xl font-black text-on-surface font-headline">{formatCurrency(data?.avgOrderValue)}</h2>
           <p className="text-[10px] text-purple-600 font-bold mt-2">Up ₹120 this month</p>
        </div>
        <div className="p-8 rounded-[2.5rem] bg-surface-container-lowest border border-theme-border shadow-sm group hover:-translate-y-1 transition-all">
           <span className="material-symbols-outlined text-amber-500 bg-amber-500/10 p-2 rounded-[1rem] mb-4 group-hover:scale-110 transition-transform">timer</span>
           <p className="text-[10px] font-black uppercase text-theme-text-muted tracking-widest mb-1">Turnaround Time</p>
           <h2 className="text-3xl font-black text-on-surface font-headline">{data?.avgTurnaround || 2.1} <span className="text-sm font-bold text-theme-text-muted">days</span></h2>
           <p className="text-[10px] text-amber-600 font-bold mt-2 hover:text-amber-500 transition-colors">Efficiency optimized</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-panel bg-theme-surface rounded-[3rem] p-8 lg:p-10 border border-theme-border shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:bg-primary/10 transition-colors duration-700"></div>
          
          <div className="flex justify-between items-center mb-10 relative z-10">
            <h3 className="text-xl font-black text-theme-text font-headline">Revenue Velocity</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-theme-surface-container px-3 py-1.5 rounded-xl border border-theme-border">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-[10px] font-black text-theme-text uppercase tracking-widest">Revenue</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-end gap-3 h-64 relative">
             {/* Grid Lines */}
             <div className="absolute inset-0 flex flex-col justify-between opacity-5">
               {[1,2,3,4].map(i => <div key={i} className="border-t border-black w-full"></div>)}
             </div>
             
             {data?.dailyRevenue?.map((d, i) => {
               const height = (d.revenue / maxRevenue) * 100;
               const dayNum = new Date(d.day).getDay();
               return (
                 <div key={i} className="flex-1 flex flex-col items-center gap-4 relative z-10 group">
                   <div className="w-full bg-theme-surface-container rounded-t-2xl overflow-hidden h-full flex items-end">
                      <div 
                        className={`w-full transition-all duration-700 group-hover:brightness-110 ${i === 6 ? 'primary-gradient shadow-lg shadow-emerald-500/20' : 'bg-primary/20'}`}
                        style={{ height: `${height}%` }}
                      ></div>
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-widest text-theme-text-muted">{dayLabels[dayNum]}</span>
                   {/* Tooltip */}
                   <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-theme-text text-theme-bg px-3 py-1.5 rounded-[1rem] shadow-lg text-[10px] font-black tracking-wider whitespace-nowrap z-20 pointer-events-none">
                     {formatCurrency(d.revenue)}
                   </div>
                 </div>
               );
             })}
          </div>
        </div>

        {/* Status Mix */}
        <div className="bg-theme-surface rounded-[3rem] p-8 lg:p-10 border border-theme-border shadow-xl relative overflow-hidden group">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
          <h3 className="text-xl font-black text-theme-text font-headline mb-8 relative z-10">Operational Mix</h3>
          <div className="space-y-6 relative z-10">
            {data?.ordersByStatus?.map(s => {
              const percentage = data.totalOrders > 0 ? Math.round((s.count / data.totalOrders) * 100) : 0;
              const colorClass = s.status === 'delivered' ? 'bg-theme-text-muted' :
                                 s.status === 'ready' ? 'bg-emerald-500' :
                                 s.status === 'processing' ? 'bg-amber-500' : 'bg-blue-500';
              return (
                <div key={s.status} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-theme-text-muted">{s.status}</span>
                    <span className="text-theme-text bg-theme-surface-container px-2 py-0.5 rounded-md border border-theme-border">{percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-theme-surface-container rounded-full overflow-hidden border border-theme-border">
                    <div className={`h-full ${colorClass} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-10 p-5 bg-primary/10 rounded-[1.5rem] flex items-center gap-3 border border-primary/20 relative z-10 shadow-sm shadow-primary/5 hover:-translate-y-1 transition-transform">
             <span className="material-symbols-outlined text-primary text-2xl drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">tips_and_updates</span>
             <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-relaxed">Most orders are in 'Ready' state. Optimize pickup scheduling.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Top Services */}
         <div className="bg-theme-surface rounded-[3rem] border border-theme-border overflow-x-auto shadow-xl">
            <div className="p-6 lg:p-8 border-b border-theme-border min-w-max flex items-center gap-3">
               <span className="material-symbols-outlined text-theme-text bg-theme-surface-container p-2 rounded-[1rem] border border-theme-border">dry_cleaning</span>
               <h3 className="text-lg font-black text-theme-text font-headline">Service Performance</h3>
            </div>
            <table className="w-full text-left min-w-[400px]">
               <thead className="bg-theme-surface-container/50 border-b border-theme-border">
                  <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted">
                    <th className="px-8 py-5">Service Layer</th>
                    <th className="px-8 py-5">Vol</th>
                    <th className="px-8 py-5 text-right">Revenue</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-theme-border/50">
                  {data?.topServices?.map(s => (
                    <tr key={s.service_type} className="hover:bg-theme-surface-container transition-colors group">
                      <td className="px-8 py-5 text-xs font-black text-theme-text uppercase tracking-widest group-hover:text-primary transition-colors">{s.service_type}</td>
                      <td className="px-8 py-5 text-xs font-bold text-theme-text-muted bg-theme-surface-container/30">{s.count}</td>
                      <td className="px-8 py-5 text-xs font-black text-primary text-right">{formatCurrency(s.revenue)}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* Top Garments */}
         <div className="bg-theme-surface rounded-[3rem] border border-theme-border overflow-x-auto shadow-xl">
            <div className="p-6 lg:p-8 border-b border-theme-border min-w-max flex items-center gap-3">
               <span className="material-symbols-outlined text-theme-text bg-theme-surface-container p-2 rounded-[1rem] border border-theme-border">apparel</span>
               <h3 className="text-lg font-black text-theme-text font-headline">Garment Mix</h3>
            </div>
            <table className="w-full text-left min-w-[300px]">
               <thead className="bg-theme-surface-container/50 border-b border-theme-border">
                  <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted">
                    <th className="px-8 py-5">Garment Identity</th>
                    <th className="px-8 py-5 text-right">Count</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-theme-border/50">
                  {data?.topGarments?.map(g => (
                    <tr key={g.garment_type} className="hover:bg-theme-surface-container transition-colors group">
                      <td className="px-8 py-5 text-xs font-black text-theme-text uppercase tracking-widest group-hover:text-primary transition-colors">{g.garment_type}</td>
                      <td className="px-8 py-5 text-[10px] font-black text-primary uppercase tracking-widest text-right bg-primary/5">{g.count} units</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Payment Grid */}
      <section className="space-y-6 mt-12 bg-theme-surface p-8 rounded-[3rem] border border-theme-border relative overflow-hidden group shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000"></div>
        <h3 className="text-xl font-black text-theme-text font-headline px-2 relative z-10 flex items-center gap-3 tracking-tighter">
          <span className="material-symbols-outlined text-primary text-3xl">verified_user</span>
          Payment Integrity
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
          {data?.paymentMethods?.map(pm => (
            <div key={pm.payment_method} className="p-8 bg-theme-surface-container hover:bg-theme-bg border border-theme-border rounded-[2.5rem] shadow-sm hover:-translate-y-2 hover:shadow-xl transition-all duration-300 text-center flex flex-col justify-center items-center group/card cursor-default">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted shrink-0 mb-4 bg-theme-surface px-3 py-1.5 rounded-xl border border-theme-border">{pm.payment_method}</span>
              <p className="text-2xl lg:text-3xl font-black text-theme-text tracking-tighter leading-none mb-3 font-headline group-hover/card:text-primary transition-colors">{formatCurrency(pm.total)}</p>
              <p className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-md">{pm.count} xactions</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
