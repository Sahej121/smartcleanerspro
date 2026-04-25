'use client';

import React from 'react';

export default function ScheduleSection({
  schedule,
  setSchedule,
  setCurrentStep,
  t
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-fade-in-up">
      <div className="w-full max-w-2xl bg-theme-surface rounded-[2rem] p-8 shadow-xl border border-theme-border/50 card-hover">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-theme-surface-container text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">schedule</span>
          </div>
          <div>
            <h2 className="text-2xl font-black font-headline text-theme-text">{t('scheduling_details')}</h2>
            <p className="text-sm font-medium text-theme-text-muted">{t('scheduling_desc')}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-theme-border bg-theme-surface-container/50">
            <h3 className="text-xs font-black uppercase tracking-widest text-theme-text-muted/70 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">local_shipping</span> Pickup Window
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-theme-text-muted mb-1 block uppercase">{t('date_label')}</label>
                <input type="date" className="w-full bg-theme-surface border border-theme-border rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" value={schedule.pickupDate} onChange={e => setSchedule({...schedule, pickupDate: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-theme-text-muted mb-1 block uppercase">{t('time_label')}</label>
                <input type="time" className="w-full bg-theme-surface border border-theme-border rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" value={schedule.pickupTime} onChange={e => setSchedule({...schedule, pickupTime: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-theme-border bg-theme-surface-container/50">
            <h3 className="text-xs font-black uppercase tracking-widest text-theme-text-muted/70 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">how_to_reg</span> Delivery Window
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-theme-text-muted mb-1 block uppercase">{t('date_label')}</label>
                <input type="date" className="w-full bg-theme-surface border border-theme-border rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" value={schedule.deliveryDate} onChange={e => setSchedule({...schedule, deliveryDate: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-theme-text-muted mb-1 block uppercase">{t('time_label')}</label>
                <input type="time" className="w-full bg-theme-surface border border-theme-border rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" value={schedule.deliveryTime} onChange={e => setSchedule({...schedule, deliveryTime: e.target.value})} />
              </div>
            </div>
          </div>
        </div>

        {/* Validation Message */}
        {schedule.pickupDate && schedule.deliveryDate && new Date(`${schedule.pickupDate}T${schedule.pickupTime || '00:00'}`) > new Date(`${schedule.deliveryDate}T${schedule.deliveryTime || '00:00'}`) && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 animate-shake">
            <span className="material-symbols-outlined text-xl">error</span>
            <span className="text-sm font-bold">{t('scheduling_error')}</span>
          </div>
        )}

        <div className="flex gap-4 mt-8 pt-6 border-t border-theme-border">
          <button onClick={() => setCurrentStep(2)} className="px-8 py-4 rounded-2xl bg-theme-surface border border-theme-border font-bold text-theme-text-muted hover:bg-theme-surface-container transition-colors">Back</button>
          <button 
            onClick={() => setCurrentStep(4)} 
            disabled={
              !schedule.pickupDate || 
              !schedule.deliveryDate || 
              new Date(`${schedule.pickupDate}T${schedule.pickupTime || '00:00'}`) > new Date(`${schedule.deliveryDate}T${schedule.deliveryTime || '00:00'}`)
            }
            className="flex-1 px-8 py-4 rounded-2xl primary-gradient text-white font-black shadow-lg shadow-emerald-900/10 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            Proceed to Payment <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
