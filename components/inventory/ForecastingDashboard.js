'use client';
import { useState, useEffect } from 'react';

export default function ForecastingDashboard({ inventory }) {
  const forecastingItems = inventory.filter(i => i.burn_rate > 0 || i.runway_days !== null);
  const learningItems = inventory.filter(i => !i.burn_rate || i.runway_days === null);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Forecasting Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-theme-surface border border-theme-border p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted">Forecasting Engine</span>
          </div>
          <h3 className="text-3xl font-black text-theme-text tracking-tighter mb-1">{forecastingItems.length}</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Active Analysis Nodes</p>
        </div>

        <div className="bg-theme-surface border border-theme-border p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
              <span className="material-symbols-outlined">emergency_home</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted">Critical Runway</span>
          </div>
          <h3 className="text-3xl font-black text-theme-text tracking-tighter mb-1">
            {forecastingItems.filter(i => i.runway_days < 7).length}
          </h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Items under 7 days</p>
        </div>

        <div className="bg-theme-surface border border-theme-border p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <span className="material-symbols-outlined">model_training</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted">Intelligence Status</span>
          </div>
          <h3 className="text-3xl font-black text-theme-text tracking-tighter mb-1">{learningItems.length}</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Items in Learning Phase</p>
        </div>
      </div>

      {/* Main Forecasting View */}
      <div className="bg-theme-surface border border-theme-border rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-theme-border bg-theme-surface-container/30 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-theme-text tracking-tight">Predictive Replenishment</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted">AI-driven stockout forecasting</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-theme-surface border border-theme-border">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[10px] font-black text-theme-text uppercase tracking-widest">Live Engine</span>
          </div>
        </div>

        <div className="p-8">
          <div className="space-y-6">
            {forecastingItems.length === 0 && learningItems.length > 0 && (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
                  <span className="material-symbols-outlined text-4xl animate-pulse">psychology</span>
                </div>
                <h4 className="text-xl font-black text-theme-text mb-2">Algorithm is Learning</h4>
                <p className="text-sm font-bold text-theme-text-muted max-w-md mx-auto">
                  We're currently analyzing your resource burn rates. Perform a few stock audits to calibrate the forecasting engine.
                </p>
              </div>
            )}

            {forecastingItems.sort((a, b) => (a.runway_days || 999) - (b.runway_days || 999)).map((item, idx) => {
              const runway = item.runway_days || 0;
              const isCritical = runway < 7;
              const isSafe = runway > 30;

              return (
                <div key={item.id} className="group p-6 rounded-[2rem] border border-theme-border bg-theme-surface-container/20 hover:bg-theme-surface-container/40 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner ${
                        isCritical ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 
                        isSafe ? 'bg-primary/20 text-primary border-primary/30' :
                        'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }`}>
                        <span className="material-symbols-outlined text-2xl">
                          {isCritical ? 'warning' : isSafe ? 'task_alt' : 'trending_down'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-theme-text tracking-tight">{item.item_name}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted">
                          Usage: {parseFloat(item.burn_rate).toFixed(2)} {item.unit}/day
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-end gap-2">
                        <span className={`text-4xl font-black font-headline tracking-tighter ${
                          isCritical ? 'text-amber-500' : isSafe ? 'text-primary' : 'text-theme-text'
                        }`}>
                          {runway}
                        </span>
                        <span className="text-sm font-black text-theme-text-muted mb-1.5 uppercase tracking-widest">Days</span>
                      </div>
                      <p className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${
                        isCritical ? 'bg-amber-500/10 text-amber-500' : 
                        isSafe ? 'bg-primary/10 text-primary' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {isCritical ? 'Critical Stockout Risk' : isSafe ? 'Optimal Supply' : 'Stable Inventory'}
                      </p>
                    </div>
                  </div>

                  {/* Visual Runway Bar */}
                  <div className="mt-6 relative h-3 bg-theme-surface rounded-full overflow-hidden border border-theme-border/50">
                    <div 
                      className={`absolute left-0 top-0 h-full transition-all duration-1000 ${
                        isCritical ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 
                        isSafe ? 'bg-primary shadow-[0_0_15px_rgba(16,185,129,0.5)]' :
                        'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                      }`}
                      style={{ width: `${Math.min(100, (runway / 45) * 100)}%` }}
                    ></div>
                    {/* Reorder Threshold Marker */}
                    <div className="absolute top-0 w-[2px] h-full bg-white/30" style={{ left: '15.5%' }}></div>
                  </div>
                  <div className="mt-2 flex justify-between">
                     <span className="text-[8px] font-black text-theme-text-muted uppercase tracking-[0.2em]">Depletion Point (7 Days)</span>
                     <span className="text-[8px] font-black text-theme-text-muted uppercase tracking-[0.2em]">Safe Zone (45+ Days)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
