'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import Link from 'next/link';
import { useUser, ROLES } from '@/lib/UserContext';
import { normalizeTier } from '@/lib/tier-config';
import { useMachineNetwork } from '@/lib/machines/useMachineNetwork';

const MACHINE_TYPES = {
  washer: { label: 'Industrial Washer', icon: 'local_laundry_service', color: 'blue' },
  dryer: { label: 'High-Temp Dryer', icon: 'air', color: 'amber' },
  dry_clean_machine: { label: 'Dry Clean Pro', icon: 'opacity', color: 'emerald' },
  steam_press: { label: 'Steam Press', icon: 'iron', color: 'purple' },
};

const STATUS_COLORS = {
  idle: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  running: 'bg-primary/10 text-primary border-primary/20',
  maintenance: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function MachineOperationsPage() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useUser();
  const { machines, loading, isLive, setIsLive, refresh } = useMachineNetwork(user?.store_id);

  const toggleMaintenance = async (id, currentStatus) => {
    const newStatus = currentStatus === 'maintenance' ? 'idle' : 'maintenance';
    try {
      const res = await fetch(`/api/machines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) refresh();
    } catch (err) {
      console.error('Failed to update machine status:', err);
    }
  };

  if (authLoading || loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="w-16 h-16 rounded-full border-4 border-theme-border border-t-primary animate-spin mb-6"></div>
      <p className="text-sm font-black text-theme-text-muted uppercase tracking-widest animate-pulse">Initializing Machine Network...</p>
    </div>
  );

  const isEnterprise = user?.role === 'owner' || user?.role === 'superadmin' || normalizeTier(user?.tier) === 'enterprise' || user?.id === 1;
  
  if (!isEnterprise) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
         <div className="max-w-2xl space-y-8 bg-surface/80 border border-theme-border p-12 rounded-[3.5rem] shadow-2xl backdrop-blur-3xl">
            <div className="w-20 h-20 rounded-3xl primary-gradient text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20">
              <span className="material-symbols-outlined text-4xl">precision_manufacturing</span>
            </div>
            <h1 className="text-5xl font-black text-theme-text tracking-tighter">ENTERPRISE <br/><span className="text-primary">MACHINE OPS</span></h1>
            <p className="text-theme-text-muted text-lg font-bold">Monitor industrial-grade hardware, track load efficiency, and manage maintenance cycles in real-time.</p>
            <div className="pt-8 border-t border-theme-border flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/admin/billing" className="px-10 py-5 primary-gradient text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/30">Upgrade to Enterprise</Link>
              <Link href="/" className="px-10 py-5 rounded-2xl border border-theme-border text-[11px] font-black text-theme-text uppercase tracking-widest">Back to Dashboard</Link>
            </div>
         </div>
      </div>
    );
  }

  const activeCount = machines.filter(m => m.status === 'running').length;

  return (
    <div className="min-h-screen bg-background text-theme-text p-4 lg:p-8 font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-surface/80 border border-theme-border p-8 rounded-[3rem] backdrop-blur-3xl shadow-xl">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] primary-gradient text-white flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-3xl">precision_manufacturing</span>
            </div>
            <div>
              <h1 className="text-4xl font-black text-theme-text tracking-tighter italic">Machine Operations</h1>
              <div className="flex items-center gap-3 mt-1 cursor-pointer" onClick={() => setIsLive(!isLive)}>
                <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-theme-text-muted'}`}></span>
                <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.2em]">
                  {isLive ? 'Live Hardware Polling' : 'Standard Monitoring'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-theme-surface-container px-6 py-3 rounded-2xl border border-theme-border">
              <p className="text-[9px] font-black text-theme-text-muted uppercase tracking-[0.2em] mb-1">Active Loads</p>
              <p className="text-2xl font-black text-theme-text">{machines.reduce((acc, m) => acc + (m.active_loads || 0), 0)}</p>
            </div>
            <div className="bg-theme-surface-container px-6 py-3 rounded-2xl border border-theme-border">
              <p className="text-[9px] font-black text-theme-text-muted uppercase tracking-[0.2em] mb-1">Utilization</p>
              <p className="text-2xl font-black text-primary">{machines.length > 0 ? Math.round((activeCount / machines.length) * 100) : 0}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {machines.map((machine) => {
            const typeInfo = MACHINE_TYPES[machine.machine_type] || MACHINE_TYPES.washer;
            const statusClass = STATUS_COLORS[machine.status] || STATUS_COLORS.idle;
            const telemetry = machine.telemetry;

            return (
              <div key={machine.id} className="bg-surface border border-theme-border rounded-[2.5rem] p-8 space-y-6 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                {machine.status === 'running' && (
                  <div className="absolute top-0 right-0 p-4">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <div className={`w-14 h-14 rounded-2xl bg-theme-surface-container flex items-center justify-center border border-theme-border text-theme-text-muted group-hover:text-primary transition-colors`}>
                    <span className="material-symbols-outlined text-2xl">{typeInfo.icon}</span>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusClass}`}>
                    {machine.status}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-theme-text italic">{machine.machine_name}</h3>
                  <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.2em] mt-1">{typeInfo.label}</p>
                </div>

                {machine.status === 'running' && telemetry && (
                  <div className="space-y-4">
                    {/* Telemetry Chips */}
                    <div className="flex gap-2">
                       <div className="flex-1 bg-theme-surface-container p-2 rounded-xl border border-theme-border flex flex-col items-center">
                          <p className="text-[8px] font-black text-theme-text-muted uppercase tracking-widest mb-1">Temp</p>
                          <p className="text-xs font-black text-theme-text">{telemetry.temp.toFixed(1)}°C</p>
                       </div>
                       <div className="flex-1 bg-theme-surface-container p-2 rounded-xl border border-theme-border flex flex-col items-center">
                          <p className="text-[8px] font-black text-theme-text-muted uppercase tracking-widest mb-1">Vibe</p>
                          <p className="text-xs font-black text-theme-text">{telemetry.vibration.toFixed(2)}g</p>
                       </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest">Active Batch Processing</p>
                        <p className="text-xs font-black text-theme-text italic">{Math.round(telemetry.progress)}%</p>
                      </div>
                      <div className="h-2 bg-theme-surface-container rounded-full overflow-hidden p-0.5 border border-theme-border">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-1000" 
                          style={{ width: `${telemetry.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {machine.status === 'idle' && (
                  <div className="py-6 border-y border-theme-border/50 border-dashed text-center">
                    <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest">Standby • Ready for Loads</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  {machine.status !== 'maintenance' && (
                    <button className="flex-1 py-3 bg-theme-surface-container hover:bg-primary hover:text-white border border-theme-border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                      Start Load
                    </button>
                  )}
                  <button 
                    onClick={() => toggleMaintenance(machine.id, machine.status)}
                    className={`flex-1 py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      machine.status === 'maintenance' 
                        ? 'bg-emerald-500 text-white border-emerald-600' 
                        : 'bg-theme-surface-container hover:bg-red-500 hover:text-white border-theme-border'
                    }`}
                  >
                    {machine.status === 'maintenance' ? 'Return to Service' : 'Maintenance'}
                  </button>
                </div>
              </div>
            );
          })}

          <button className="bg-theme-surface-container/50 border-2 border-dashed border-theme-border rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4 hover:border-primary/50 transition-all group">
            <div className="w-14 h-14 rounded-full bg-surface border border-theme-border flex items-center justify-center text-theme-text-muted group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">add</span>
            </div>
            <p className="text-[11px] font-black text-theme-text-muted uppercase tracking-[0.3em]">Provision New Node</p>
          </button>
        </div>
      </div>
    </div>
  );
}
