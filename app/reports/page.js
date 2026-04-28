'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function ReportsPage() {
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [revenueData, setRevenueData] = useState({ byMethod: [], daily: [] });
  const [statusData, setStatusData] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    const params = `?start=${dateRange.start}T00:00:00&end=${dateRange.end}T23:59:59`;
    
    const [rev, stat, stf] = await Promise.all([
      fetch(`/api/reports/revenue${params}`).then(r => r.json()).catch(() => ({ byMethod: [], daily: [] })),
      fetch(`/api/reports/status${params}`).then(r => r.json()).catch(() => []),
      fetch(`/api/reports/staff${params}`).then(r => r.json()).catch(() => [])
    ]);

    setRevenueData(rev && rev.byMethod ? rev : { byMethod: [], daily: [] });
    setStatusData(Array.isArray(stat) ? stat : []);
    setStaffData(Array.isArray(stf) ? stf : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const handleExportCSV = () => {
    if (!revenueData || !revenueData.daily) return;
    let csv = 'Date,Method,Amount\n';
    revenueData.daily.forEach(d => {
      csv += `${d.date},Total,${d.total}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `cleanflow_revenue_${dateRange.start}_to_${dateRange.end}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const totalRevenue = (revenueData?.byMethod || []).reduce((s, m) => s + parseFloat(m.total || 0), 0);

  return (
    <div className="min-h-screen bg-background text-theme-text p-4 lg:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-surface border border-theme-border p-8 rounded-[3rem] relative overflow-hidden group shadow-2xl shadow-theme-shadow/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>

          <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
             <div className="w-16 h-16 rounded-3xl bg-background border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] transition-all shrink-0">
               <span className="material-symbols-outlined text-3xl">analytics</span>
             </div>
             <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">{t('analytics')}</span>
                </div>
                <h1 className="text-4xl font-black text-theme-text tracking-tighter">{t('business_intelligence')}</h1>
                <p className="text-theme-text-muted font-medium text-sm mt-1">{t('reports_desc')}</p>
             </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 relative z-10 w-full md:w-auto">
            <div className="flex flex-wrap items-center gap-4 bg-background p-2 rounded-[2rem] border border-theme-border/50 shadow-inner">
              <div className="flex flex-col md:flex-row items-center gap-2 px-4 py-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted">{t('from')}</span>
                <input 
                  type="date" 
                  className="text-sm font-bold bg-transparent text-theme-text border-none outline-none cursor-pointer focus:text-emerald-400 transition-colors"
                  value={dateRange.start}
                  onChange={e => setDateRange({...dateRange, start: e.target.value})}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div className="w-px h-8 bg-slate-800 hidden md:block"></div>
              <div className="flex flex-col md:flex-row items-center gap-2 px-4 py-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted">{t('to')}</span>
                <input 
                  type="date" 
                  className="text-sm font-bold bg-transparent text-theme-text border-none outline-none cursor-pointer focus:text-emerald-400 transition-colors"
                  value={dateRange.end}
                  onChange={e => setDateRange({...dateRange, end: e.target.value})}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
            
            <button 
              onClick={handleExportCSV}
              className="px-6 py-4 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-500 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 h-full"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-theme-border border-t-emerald-500 animate-spin"></div>
            <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest animate-pulse">{t('compiling_engine')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up stagger-1">
            
            {/* Revenue Summary */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-surface rounded-[2.5rem] p-8 border border-theme-border shadow-sm space-y-6 flex flex-col group hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-center">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted">{t('total_revenue')}</h3>
                 <span className="material-symbols-outlined text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 w-10 h-10 rounded-[1rem] flex items-center justify-center group-hover:scale-110 transition-transform">payments</span>
              </div>
              <div className="mt-auto pb-4">
                <p className="text-5xl font-black text-theme-text tracking-tighter">₹{totalRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    <span className="material-symbols-outlined text-[12px]">trending_up</span>
                    Live Collections
                  </span>
                </div>
              </div>
              
              {/* Payment Methods Breakdown */}
              <div className="pt-6 border-t border-theme-border/50 grid grid-cols-3 gap-4">
                {revenueData.byMethod.map(m => (
                  <div key={m.method} className="bg-background p-4 rounded-[1.5rem] border border-theme-border/50 hover:border-emerald-500/30 transition-colors text-center md:text-left">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted mb-1">{m.method}</p>
                    <p className="text-lg font-black text-theme-text">₹{parseFloat(m.total).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
  
            {/* Status Breakdown */}
            <div className="bg-surface rounded-[2.5rem] p-8 border border-theme-border shadow-sm space-y-6 group hover:border-slate-700 transition-colors">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted flex items-center justify-between">
                 Order Status
                 <span className="material-symbols-outlined text-[16px] text-blue-500 bg-blue-500/10 p-1 rounded-lg">data_usage</span>
               </h3>
               <div className="space-y-5">
                 {statusData.map(s => {
                   const percentage = (s.count / statusData.reduce((acc, curr) => acc + parseInt(curr.count), 0)) * 100 || 0;
                   const colorMap = {
                     'delivered': 'bg-slate-500',
                     'ready': 'bg-emerald-500',
                     'processing': 'bg-blue-500',
                     'pending': 'bg-amber-500',
                   };
                   const bgColor = colorMap[s.status] || 'bg-slate-500';
                   const textColorMap = {
                     'delivered': 'text-slate-400',
                     'ready': 'text-emerald-400',
                     'processing': 'text-blue-400',
                     'pending': 'text-amber-400',
                   };
                   const textColor = textColorMap[s.status] || 'text-slate-400';
                   
                   return (
                     <div key={s.status} className="space-y-2">
                       <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                         <span className={textColor}>{t(s.status)}</span>
                         <span className="text-theme-text bg-slate-800 px-2 rounded">{s.count}</span>
                       </div>
                       <div className="h-1.5 bg-background rounded-full overflow-hidden shadow-inner">
                         <div className={`h-full rounded-full transition-all duration-1000 ease-out ${bgColor}`} style={{ width: `${percentage}%` }}></div>
                       </div>
                     </div>
                   );
                 })}
                 {statusData.length === 0 && (
                   <p className="text-[10px] text-theme-text-muted font-bold tracking-widest text-center py-6 border border-dashed border-theme-border rounded-[1.5rem]">{t('no_orders_active')}</p>
                 )}
               </div>
            </div>
  
            {/* Top Performer Card */}
            <div className="bg-surface rounded-[2.5rem] p-8 border border-theme-border shadow-sm space-y-6 flex flex-col items-center justify-center text-center group hover:border-amber-500/30 transition-colors relative overflow-hidden">
               <div className="absolute top-4 right-4 text-amber-500/20 group-hover:text-amber-500/40 transition-colors">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
               </div>
               
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted w-full text-left absolute top-8 left-8">{t('top_performer')}</h3>
               
               {staffData[0] ? (
                 <div className="space-y-4 pt-6 group-hover:-translate-y-2 transition-transform">
                   <div className="w-20 h-20 bg-background border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)] rounded-[1.5rem] mx-auto flex items-center justify-center text-amber-500 mb-2">
                      <span className="material-symbols-outlined text-4xl">person</span>
                   </div>
                   <p className="text-xl font-black text-theme-text tracking-tighter">{staffData[0].username}</p>
                   <p className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 uppercase tracking-[0.2em] inline-block shadow-sm">
                     {staffData[0].orders_created} {t('orders_created_label')}
                   </p>
                 </div>
               ) : (
                 <div className="pt-6">
                    <div className="w-16 h-16 bg-background border border-theme-border border-dashed rounded-[1.5rem] mx-auto flex items-center justify-center text-theme-text-muted mb-4">
                      <span className="material-symbols-outlined text-2xl">person_off</span>
                    </div>
                    <p className="text-[10px] text-theme-text-muted font-bold uppercase tracking-widest italic">{t('no_data_available')}</p>
                 </div>
               )}
            </div>
  
            {/* Staff Performance Table */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-surface rounded-[2.5rem] border border-theme-border shadow-sm overflow-hidden flex flex-col h-full mt-4">
               <div className="px-8 py-6 border-b border-theme-border/50 bg-surface/50 shrink-0">
                  <h3 className="text-lg font-black text-theme-text tracking-tighter flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-400 bg-indigo-500/10 p-1.5 rounded-[1rem] border border-indigo-500/20">group</span>
                    Staff Output Matrix
                  </h3>
               </div>
               
               <div className="overflow-x-auto flex-1 p-2">
                 <table className="w-full text-left border-collapse min-w-[600px]">
                   <thead>
                      <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted border-b border-theme-border/50">
                        <th className="py-4 px-8">{t('member_identity')}</th>
                        <th className="py-4 px-6 text-center">{t('volume')}</th>
                        <th className="py-4 px-6 text-right">{t('total_value')}</th>
                        <th className="py-4 px-8 text-right">{t('aov')}</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800/50">
                     {staffData.length > 0 ? staffData.map((s, idx) => (
                       <tr key={s.username} className="hover:bg-slate-800/30 transition-colors group">
                         <td className="py-5 px-8 flex items-center gap-3">
                           <div className="w-8 h-8 rounded-xl bg-background border border-slate-700 text-slate-400 flex items-center justify-center text-xs font-black uppercase group-hover:border-emerald-500/50 group-hover:text-emerald-500 transition-colors">
                             {s.username.charAt(0)}
                           </div>
                           <span className="text-sm font-black text-theme-text group-hover:text-theme-text transition-colors">{s.username}</span>
                           {idx === 0 && <span className="material-symbols-outlined text-[16px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>}
                         </td>
                         <td className="py-5 px-6 text-center">
                           <span className="text-[10px] font-black text-slate-400 bg-background px-3 py-1 rounded-lg border border-theme-border">{s.orders_created}</span>
                         </td>
                         <td className="py-5 px-6 text-right">
                           <span className="text-sm font-black text-theme-text">₹{parseFloat(s.total_value || 0).toLocaleString()}</span>
                         </td>
                         <td className="py-5 px-8 text-right">
                           <span className="text-sm font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 inline-block min-w-24">
                              ₹{Math.round((s.total_value || 0) / (s.orders_created || 1)).toLocaleString()}
                           </span>
                         </td>
                       </tr>
                     )) : (
                       <tr>
                         <td colSpan="4" className="py-16 text-center text-theme-text-muted">
                           <span className="material-symbols-outlined text-4xl mb-4 text-slate-700">group_off</span>
                           <p className="text-[10px] font-black uppercase tracking-widest">{t('no_staff_activity')}</p>
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
