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
           <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500">
             <span className="material-symbols-outlined text-sm">calendar_today</span>
             Last 30 Days
           </div>
           <button className="px-5 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm hover:bg-emerald-100 transition-all">
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
        <div className="p-8 rounded-[2.5rem] bg-surface-container-lowest border border-outline-variant/10 shadow-sm">
           <span className="material-symbols-outlined text-blue-500 mb-4">local_mall</span>
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Order Volume</p>
           <h2 className="text-3xl font-black text-on-surface font-headline">{data?.totalOrders || 0}</h2>
           <p className="text-[10px] text-slate-400 font-bold mt-2">Consistent performance</p>
        </div>
        <div className="p-8 rounded-[2.5rem] bg-surface-container-lowest border border-outline-variant/10 shadow-sm">
           <span className="material-symbols-outlined text-purple-500 mb-4">analytics</span>
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Avg. Ticket Size</p>
           <h2 className="text-3xl font-black text-on-surface font-headline">{formatCurrency(data?.avgOrderValue)}</h2>
           <p className="text-[10px] text-purple-600 font-bold mt-2">Up ₹120 this month</p>
        </div>
        <div className="p-8 rounded-[2.5rem] bg-surface-container-lowest border border-outline-variant/10 shadow-sm">
           <span className="material-symbols-outlined text-amber-500 mb-4">timer</span>
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Turnaround Time</p>
           <h2 className="text-3xl font-black text-on-surface font-headline">{data?.avgTurnaround || 2.1} <span className="text-sm font-bold text-slate-400">days</span></h2>
           <p className="text-[10px] text-amber-600 font-bold mt-2">Efficiency optimized</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-panel rounded-[2.5rem] p-8 border border-outline-variant/10">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black text-on-surface font-headline">Revenue Velocity</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary/20"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</span>
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
                   <div className="w-full bg-slate-50/50 rounded-t-2xl overflow-hidden h-full flex items-end">
                      <div 
                        className={`w-full transition-all duration-700 group-hover:brightness-110 ${i === 6 ? 'primary-gradient shadow-lg shadow-emerald-500/20' : 'bg-primary/10'}`}
                        style={{ height: `${height}%` }}
                      ></div>
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{dayLabels[dayNum]}</span>
                   {/* Tooltip */}
                   <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-on-surface text-white px-3 py-1 rounded-lg text-[9px] font-bold whitespace-nowrap z-20 pointer-events-none">
                     {formatCurrency(d.revenue)}
                   </div>
                 </div>
               );
             })}
          </div>
        </div>

        {/* Status Mix */}
        <div className="bg-surface-container-lowest rounded-[2.5rem] p-8 border border-outline-variant/10">
          <h3 className="text-xl font-black text-on-surface font-headline mb-8">Operational Mix</h3>
          <div className="space-y-6">
            {data?.ordersByStatus?.map(s => {
              const percentage = data.totalOrders > 0 ? Math.round((s.count / data.totalOrders) * 100) : 0;
              const colorClass = s.status === 'delivered' ? 'bg-slate-400' :
                                 s.status === 'ready' ? 'bg-emerald-500' :
                                 s.status === 'processing' ? 'bg-amber-500' : 'bg-blue-500';
              return (
                <div key={s.status} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">{s.status}</span>
                    <span className="text-on-surface">{percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-10 p-4 bg-emerald-50 rounded-2xl flex items-center gap-3">
             <span className="material-symbols-outlined text-emerald-600">tips_and_updates</span>
             <p className="text-[10px] font-bold text-emerald-800 leading-tight">Most orders are in 'Ready' state. Optimize pickup scheduling.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Top Services */}
         <div className="bg-white rounded-[2.5rem] border border-outline-variant/10 overflow-x-auto shadow-sm">
            <div className="p-6 lg:p-8 border-b border-slate-50 min-w-max">
               <h3 className="text-lg font-black text-on-surface font-headline">Service Performance</h3>
            </div>
            <table className="w-full text-left min-w-[400px]">
               <thead className="bg-slate-50/50">
                  <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-8 py-4">Service Layer</th>
                    <th className="px-8 py-4">Vol</th>
                    <th className="px-8 py-4 text-right">Revenue</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {data?.topServices?.map(s => (
                    <tr key={s.service_type}>
                      <td className="px-8 py-4 text-xs font-bold text-on-surface uppercase tracking-tight">{s.service_type}</td>
                      <td className="px-8 py-4 text-xs font-semibold text-slate-500">{s.count}</td>
                      <td className="px-8 py-4 text-xs font-black text-emerald-800 text-right">{formatCurrency(s.revenue)}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* Top Garments */}
         <div className="bg-white rounded-[2.5rem] border border-outline-variant/10 overflow-x-auto shadow-sm">
            <div className="p-6 lg:p-8 border-b border-slate-50 min-w-max">
               <h3 className="text-lg font-black text-on-surface font-headline">Garment Mix</h3>
            </div>
            <table className="w-full text-left min-w-[300px]">
               <thead className="bg-slate-50/50">
                  <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-8 py-4">Garment Identity</th>
                    <th className="px-8 py-4 text-right">Count</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {data?.topGarments?.map(g => (
                    <tr key={g.garment_type}>
                      <td className="px-8 py-4 text-xs font-bold text-on-surface uppercase tracking-tight">{g.garment_type}</td>
                      <td className="px-8 py-4 text-xs font-black text-emerald-800 text-right">{g.count} units</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Payment Grid */}
      <section className="space-y-4">
        <h3 className="text-lg font-black text-on-surface font-headline px-2">Payment Integrity</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data?.paymentMethods?.map(pm => (
            <div key={pm.payment_method} className="p-6 bg-white border border-outline-variant/10 rounded-3xl shadow-sm text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">{pm.payment_method}</span>
              <p className="text-xl font-black text-on-surface leading-none mb-1">{formatCurrency(pm.total)}</p>
              <p className="text-[10px] font-bold text-emerald-600">{pm.count} xactions</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
