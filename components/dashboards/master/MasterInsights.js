'use client';

import React from 'react';
import { AnimatedCounter } from '@/components/common/AnimatedStats';

export default function MasterInsights({
  masterStats,
  t
}) {
  const exportXml = () => {
    const payload = {
      generated_at: new Date().toISOString(),
      total_revenue: masterStats?.total_revenue ?? masterStats?.globalRevenue ?? 0,
      total_stores: masterStats?.totalStores ?? 0,
      total_users: masterStats?.totalUsers ?? 0,
      active_orders: masterStats?.globalActiveOrders ?? 0,
      mrr: masterStats?.mrr ?? 0,
      churn: masterStats?.churn ?? 0,
    };
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<masterInsights>
  ${Object.entries(payload).map(([key, value]) => `<${key}>${value}</${key}>`).join('\n  ')}
</masterInsights>`;
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'master-insights.xml';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const reportWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
    if (!reportWindow) return;
    const revenue = masterStats?.total_revenue ?? masterStats?.globalRevenue ?? 0;
    reportWindow.document.write(`
      <html>
        <head><title>Master Insights Report</title></head>
        <body style="font-family: Arial, sans-serif; padding: 32px;">
          <h1>Master Insights Report</h1>
          <p>Generated at: ${new Date().toLocaleString()}</p>
          <ul>
            <li>Total revenue: $${Number(revenue).toLocaleString()}</li>
            <li>Total stores: ${masterStats?.totalStores ?? 0}</li>
            <li>Total users: ${masterStats?.totalUsers ?? 0}</li>
            <li>Active orders: ${masterStats?.globalActiveOrders ?? 0}</li>
            <li>MRR: $${Number(masterStats?.mrr ?? 0).toLocaleString()}</li>
            <li>Churn: ${masterStats?.churn ?? 0}%</li>
          </ul>
        </body>
      </html>
    `);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
             <h1 className="text-4xl font-black font-headline uppercase leading-none">{t('system_insights')}</h1>
             <p className="text-slate-500 italic mt-2">{t('advanced_analytics_desc')}</p>
          </div>
          <div className="flex gap-2">
             <button onClick={exportXml} className="px-6 py-3 bg-white border border-slate-100 rounded-xl font-black text-[10px] uppercase shadow-sm tracking-widest hover:bg-slate-50 transition-all">{t('export_xml')}</button>
             <button onClick={exportPdf} className="px-6 py-3 bg-theme-accent text-white rounded-xl font-black text-[10px] uppercase shadow-sm tracking-widest hover:scale-105 transition-all">{t('export_pdf')}</button>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{t('revenue_velocity')}</p>
                <h2 className="text-5xl font-black font-headline mb-8 text-on-surface">
                   <AnimatedCounter value={masterStats?.total_revenue || 0} prefix="$" />
                </h2>
                <div className="h-48 flex items-end gap-2">
                   {[0.2, 0.4, 0.35, 0.5, 0.45, 0.7, 0.65, 0.9, 0.8, 0.85, 0.95, 1.0].map((h, i) => (
                      <div key={i} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500 transition-all rounded-t-xl group relative" style={{ height: `${h * 100}%` }}>
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-theme-text text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Q{Math.ceil((i+1)/3)} M{i+1}: {Math.floor(h * 40)}k
                         </div>
                      </div>
                   ))}
                </div>
                <div className="flex justify-between mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                   <span>Fiscal Year 2024</span>
                   <span>Projected Growth +18%</span>
                </div>
             </div>
          </div>

          <div className="bg-theme-surface-container rounded-[2.5rem] p-10 relative overflow-hidden shadow-sm border border-theme-border">
             <div className="relative z-10">
                <p className="text-[10px] font-black uppercase text-primary/80 tracking-widest mb-2">{t('network_load_dist')}</p>
                <h2 className="text-5xl font-black font-headline mb-8 italic tracking-tighter text-on-surface">84,290 req/min</h2>
                
                <div className="space-y-6">
                   {[
                      { label: 'Cluster Americas', val: 45, color: 'bg-emerald-500' },
                      { label: 'Cluster Europe', val: 28, color: 'bg-emerald-300' },
                      { label: 'Cluster Asia Pacific', val: 18, color: 'bg-emerald-700' },
                      { label: 'Edge Nodes (Isolated)', val: 9, color: 'bg-slate-700' },
                   ].map((r, i) => (
                      <div key={i}>
                         <div className="flex justify-between text-[10px] font-black uppercase mb-2 text-emerald-50/60 tracking-widest">
                            <span>{r.label}</span>
                            <span>{r.val}%</span>
                         </div>
                         <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full ${r.color} shadow-[0_0_10px_rgba(16,185,129,0.2)]`} style={{ width: `${r.val}%` }}></div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
