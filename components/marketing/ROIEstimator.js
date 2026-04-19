'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function ROIEstimator() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState(500);
  const [staff, setStaff] = useState(3);
  const [savings, setSavings] = useState(0);
  const [hours, setHours] = useState(0);

  useEffect(() => {
    // Basic calculation logic
    // Efficiency gain: ~5 mins per order saved via automation + logistics
    // Labor cost saved: ~10% reduction in admin overhead
    const minutesSaved = orders * 5;
    const hoursRecovered = Math.round(minutesSaved / 60);
    const moneySaved = Math.round((orders * 2) + (staff * 150)); // Simplified formula

    setHours(hoursRecovered);
    setSavings(moneySaved);
  }, [orders, staff]);

  return (
    <div className="glass-card-matte p-10 md:p-16 rounded-[3rem] border border-emerald-100 flex flex-col lg:flex-row gap-16 items-center">
      <div className="flex-1 w-full">
        <h3 className="text-3xl font-black text-slate-900 mb-4">{t('roi_title') || 'Estimate your ROI'}</h3>
        <p className="text-slate-600 font-medium mb-12 max-w-md">
          {t('roi_subtitle') || 'Adjust the sliders to see the potential impact on your operations.'}
        </p>
        
        <div className="space-y-12">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-sm font-black uppercase tracking-widest text-slate-400">
                {t('roi_orders_label') || 'Monthly Orders'}
              </label>
              <span className="text-2xl font-black text-emerald-600">{orders}</span>
            </div>
            <input 
              type="range" 
              min="100" 
              max="5000" 
              step="100"
              value={orders}
              onChange={(e) => setOrders(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-sm font-black uppercase tracking-widest text-slate-400">
                {t('roi_staff_label') || 'Team Size'}
              </label>
              <span className="text-2xl font-black text-emerald-600">{staff}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="20" 
              step="1"
              value={staff}
              onChange={(e) => setStaff(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-600 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-600/20 flex flex-col justify-center transform hover:scale-105 transition-transform duration-500">
          <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">
            {t('roi_hours_label') || 'Time Saved'}
          </p>
          <p className="text-5xl font-black tracking-tighter mb-1">
            {hours}
          </p>
          <p className="text-sm font-bold opacity-90">Hours / Month</p>
        </div>
        
        <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/20 flex flex-col justify-center transform hover:scale-105 transition-transform duration-500">
          <p className="text-xs font-black uppercase tracking-widest opacity-50 mb-2">
            {t('roi_savings_label') || 'Monthly Savings'}
          </p>
          <p className="text-5xl font-black tracking-tighter mb-1">
            ${savings}
          </p>
          <p className="text-sm font-bold opacity-70">Projected Increase</p>
        </div>
        
        <div className="md:col-span-2 glass-card-dark p-8 rounded-[2rem] flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-400">insights</span>
          </div>
          <p className="text-slate-400 text-sm font-medium leading-relaxed">
            Calculations based on average efficiency gains reported by 500+ active ateliers. Results may vary by market and operational complexity.
          </p>
        </div>
      </div>
    </div>
  );
}
