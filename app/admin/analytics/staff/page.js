'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function StaffAnalyticsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/staff')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load analytics:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-theme-border/50 border-t-emerald-600 animate-spin" />
        <p className="text-theme-text-muted font-medium animate-pulse">Calculating productivity metrics...</p>
      </div>
    );
  }

  if (!data) return <div>Error loading data.</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-theme-text font-headline uppercase italic leading-none">
            {t('nav_staff_analytics')}
          </h1>
          <p className="text-theme-text-muted font-medium mt-1">Real-time productivity and workflow efficiency auditing.</p>
        </div>
        <div className="flex items-center gap-2 bg-theme-surface-container/50 text-theme-text-muted px-4 py-2 rounded-2xl border border-theme-border/50 shadow-sm">
          <span className="material-symbols-outlined text-base">event</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Last 7 Days</span>
        </div>
      </div>

      {/* Summary Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[2.5rem] bg-theme-surface hover:bg-theme-surface-container transition-all border border-theme-border/50 hover:border-theme-border shadow-sm relative overflow-hidden group card-hover stagger-1">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-theme-text-muted mb-4">{t('analytics_throughput')}</p>
            <h2 className="text-6xl font-black text-theme-text font-headline tracking-tighter">
              <AnimatedCounter value={data.summary.totalItems} />
            </h2>
            <div className="text-[10px] font-black text-primary mt-4 flex items-center gap-2 bg-theme-surface-container/50 text-theme-text w-fit px-3 py-1 rounded-full border border-theme-border/50">
              <span className="material-symbols-outlined text-xs">trending_up</span> 
              <span>+12.4% {t('dash_view_all').split(' ')[0]}</span>
            </div>
          </div>
          
        </div>

        <div className="p-8 rounded-[2.5rem] bg-theme-surface-container text-theme-text border border-theme-border/50 shadow-sm relative overflow-hidden group stagger-2">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-theme-text-muted mb-4">{t('analytics_cycle_time')}</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-6xl font-black font-headline tracking-tighter italic">
                {data.summary.avgCycleTime}
              </h2>
            </div>
            <p className="text-[10px] font-bold text-emerald-300/60 mt-4 uppercase tracking-widest italic font-headline">Efficiency Baseline: 2.5h</p>
          </div>
          
          <div className="absolute right-4 bottom-4 opacity-10">
             <span className="material-symbols-outlined text-7xl">timer</span>
          </div>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-theme-surface hover:bg-theme-surface-container transition-all border border-theme-border/50 hover:border-theme-border shadow-sm relative overflow-hidden group card-hover stagger-3">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-theme-text-muted mb-4">{t('analytics_top_performer')}</p>
            <h2 className="text-3xl font-black text-theme-text font-headline tracking-tighter leading-[1.1] mb-4">
              {data.summary.topPerformer}
            </h2>
            <div className="flex flex-wrap gap-2">
               <div className="px-3 py-1 bg-amber-100/80 text-amber-900 rounded-full text-[9px] font-black uppercase border border-amber-200 tracking-widest shadow-sm">👑 Weekly MVP</div>
               <div className="px-3 py-1 bg-emerald-100/80 text-theme-text rounded-full text-[9px] font-black uppercase border border-emerald-200 tracking-widest shadow-sm">Top Efficient</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Productivity Chart */}
        <div className="bg-theme-surface hover:bg-theme-surface-container transition-all p-10 rounded-[3rem] border border-theme-border/50 hover:border-theme-border shadow-sm stagger-4">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-black text-theme-text text-xl uppercase tracking-tighter italic font-headline">{t('analytics_per_day')}</h3>
            <div className="p-2 bg-theme-surface-container/50 text-theme-text rounded-xl">
              <span className="material-symbols-outlined text-primary">query_stats</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-4 h-56">
            {data.dailyThroughput.map((item, i) => {
              const max = Math.max(...data.dailyThroughput.map(d => d.count), 1);
              const height = (item.count / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-5 group">
                  <div className="w-full relative h-[180px] flex items-end">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-theme-surface-container text-theme-text border border-theme-border/50 text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 pointer-events-none whitespace-nowrap z-20 shadow-xl">
                      {item.count} items
                    </div>
                    <div 
                      className={`w-full rounded-2xl transition-all duration-1000 ease-out bar-animate shadow-sm ${i === data.dailyThroughput.length - 1 ? 'premium-gradient shadow-lg shadow-emerald-500/30' : 'bg-theme-surface-container group-hover:bg-emerald-100'}`} 
                      style={{ height: `${height}%`, animationDelay: `${i * 100}ms` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.2em]">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottleneck Table */}
        <div className="bg-theme-surface hover:bg-theme-surface-container transition-all p-10 rounded-[3rem] border border-theme-border/50 hover:border-theme-border shadow-sm stagger-5">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-black text-theme-text text-xl uppercase tracking-tighter italic font-headline">{t('analytics_bottlenecks')}</h3>
            <div className="p-2 bg-amber-50 rounded-xl">
              <span className="material-symbols-outlined text-amber-600">speed</span>
            </div>
          </div>
          <div className="space-y-7">
            {data.bottlenecks.map((b, i) => (
              <div key={i} className="flex items-center gap-6 group animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-14 h-14 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-theme-text-muted font-black group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:border-amber-100 transition-all duration-300 group-hover:scale-105 shadow-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-sm font-black text-theme-text uppercase tracking-widest">{b.stage.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest bg-theme-container px-2 py-0.5 rounded-full">{b.count} Items</span>
                  </div>
                  <div className="w-full bg-theme-surface-container h-2 rounded-full overflow-hidden p-[2px]">
                    <div 
                      className={`h-full rounded-full transition-all duration-[1.5s] ease-out ${i === 0 ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]' : 'bg-theme-surface-container/50 text-theme-text0'}`} 
                      style={{ width: `${(b.count / data.summary.totalItems) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
            {data.bottlenecks.length === 0 && (
               <div className="text-center py-16">
                  <div className="w-20 h-20 bg-theme-surface-container/50 text-theme-text rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-emerald-500 text-4xl">verified</span>
                  </div>
                  <p className="text-theme-text-muted font-black uppercase tracking-widest text-sm">No active bottlenecks detected.</p>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Staff Leaderboard */}
      <div className="bg-theme-surface hover:bg-theme-surface-container transition-all rounded-[3rem] border border-theme-border/50 hover:border-theme-border shadow-2xl shadow-slate-200/60 overflow-hidden stagger-6">
        <div className="p-10 border-b border-theme-border/50 hover:border-theme-border flex flex-col md:flex-row md:items-center justify-between bg-theme-surface-container/20 gap-4">
          <div>
            <h3 className="font-black text-theme-text text-xl uppercase tracking-tighter italic font-headline">Worker Efficiency Breakdown</h3>
            <p className="text-theme-text-muted text-xs font-medium">Individual performance audit based on 7-day throughput.</p>
          </div>
          <button className="flex items-center gap-2 text-[10px] font-black uppercase text-primary bg-theme-surface-container/50 text-theme-text hover:bg-emerald-100 px-5 py-2.5 rounded-2xl transition-all tracking-widest border border-theme-border/50">
            Export Audit Log
            <span className="material-symbols-outlined text-sm">download</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-theme-surface-container/30">
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-theme-text-muted">Staff Member</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-theme-text-muted">Role</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-theme-text-muted">Actions Performed</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-theme-text-muted">Efficiency Score</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-theme-text-muted text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y border-theme">
              {data.staffStats.map((staff, idx) => (
                <tr key={staff.id} className="hover:bg-theme-surface-container/50 text-theme-text/40 transition-all group animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-[1.25rem] bg-theme-surface-container text-primary flex items-center justify-center text-sm font-black text-emerald-800 shadow-sm border border-emerald-50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        {staff.name.charAt(0)}
                      </div>
                      <span className="text-base font-black text-theme-text tracking-tight">{staff.name}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="px-3 py-1 bg-theme-surface-container border border-theme-border/50 text-theme-text-muted text-theme-text-muted text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm">{staff.role}</span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-theme-text">{staff.actions_performed}</span>
                      <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest italic font-headline">events</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 max-w-[120px] h-2 bg-theme-surface-container rounded-full overflow-hidden p-[2px]">
                        <div className="h-full bg-theme-surface-container/50 text-theme-text0 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]" style={{ width: `${staff.efficiency}%` }}></div>
                      </div>
                      <span className="text-sm font-black text-primary italic font-headline">{staff.efficiency}%</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl ${idx < 3 ? 'bg-theme-surface-container text-theme border-theme-border' : 'bg-theme-container text-theme-text-muted'} border border-current opacity-20`}>
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {idx < 3 ? 'trending_up' : 'trending_flat'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
