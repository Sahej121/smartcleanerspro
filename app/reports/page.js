'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ReportsPage() {
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
      fetch(`/api/reports/revenue${params}`).then(r => r.json()),
      fetch(`/api/reports/status${params}`).then(r => r.json()),
      fetch(`/api/reports/staff${params}`).then(r => r.json())
    ]);

    setRevenueData(rev);
    setStatusData(stat);
    setStaffData(stf);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const handleExportCSV = () => {
    // Basic CSV export for revenue
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

  const totalRevenue = revenueData.byMethod.reduce((s, m) => s + parseFloat(m.total), 0);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-fade-in-up">
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-on-surface font-headline tracking-tight">Business Intelligence</h1>
          <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">analytics</span>
            Real-time performance metrics and financial tracking
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">From</span>
            <input 
              type="date" 
              className="text-sm font-bold bg-transparent border-none outline-none"
              value={dateRange.start}
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
            />
          </div>
          <div className="w-px h-8 bg-slate-100 hidden md:block"></div>
          <div className="flex items-center gap-2 px-4 py-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">To</span>
            <input 
              type="date" 
              className="text-sm font-bold bg-transparent border-none outline-none"
              value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
          <button 
            onClick={handleExportCSV}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Compiling Data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up stagger-1">
          {/* Revenue Summary */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Total Revenue</h3>
               <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 w-10 h-10 rounded-full flex items-center justify-center">payments</span>
            </div>
            <div>
              <p className="text-5xl font-black text-on-surface">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-emerald-600 text-xs font-bold mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                Live Collections
              </p>
            </div>
            <div className="pt-6 border-t border-slate-50 grid grid-cols-3 gap-4">
              {revenueData.byMethod.map(m => (
                <div key={m.method}>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{m.method}</p>
                  <p className="text-sm font-black text-on-surface">₹{parseFloat(m.total).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Order Status</h3>
             <div className="space-y-4">
               {statusData.map(s => {
                 const percentage = (s.count / statusData.reduce((acc, curr) => acc + parseInt(curr.count), 0)) * 100;
                 return (
                   <div key={s.status} className="space-y-1">
                     <div className="flex justify-between text-[10px] font-black uppercase">
                       <span>{s.status}</span>
                       <span>{s.count}</span>
                     </div>
                     <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>

          {/* Staff Performance Card (Preview) */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Top Performer</h3>
             {staffData[0] ? (
               <div className="text-center space-y-2">
                 <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined text-3xl">person</span>
                 </div>
                 <p className="font-black text-on-surface">{staffData[0].username}</p>
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{staffData[0].orders_created} Orders managed</p>
               </div>
             ) : (
               <p className="text-xs text-slate-400 italic">No data available</p>
             )}
          </div>

          {/* Staff Table */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
             <h3 className="text-lg font-black font-headline text-on-surface mb-6">Staff Productivity</h3>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                    <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-50">
                      <th className="pb-4">Member</th>
                      <th className="pb-4">Orders Created</th>
                      <th className="pb-4">Total Value</th>
                      <th className="pb-4">Avg Order Value</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {staffData.map(s => (
                     <tr key={s.username} className="text-sm font-medium text-slate-700">
                       <td className="py-4 font-bold text-on-surface">{s.username}</td>
                       <td className="py-4">{s.orders_created}</td>
                       <td className="py-4">₹{parseFloat(s.total_value || 0).toLocaleString()}</td>
                       <td className="py-4 text-emerald-600 font-bold">₹{Math.round((s.total_value || 0) / (s.orders_created || 1)).toLocaleString()}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
