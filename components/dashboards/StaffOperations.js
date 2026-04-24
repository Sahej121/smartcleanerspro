'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function StaffOperations({ user }) {
  const { t } = useLanguage();
  const [workflow, setWorkflow] = useState({});
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [activeBroadcast, setActiveBroadcast] = useState(null);
  const [drivers, setDrivers] = useState([]);

  const fetchData = async () => {
    try {
      const [wfRes, tasksRes, broadcastRes] = await Promise.all([
        fetch('/api/workflow'),
        fetch('/api/tasks'),
        fetch('/api/system/broadcast/active')
      ]);
      const wfData = await wfRes.json();
      const tasksData = await tasksRes.json();
      const broadcastData = await broadcastRes.json().catch(() => null);
      
      setWorkflow(wfData);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setActiveBroadcast(broadcastData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/staff?role=driver');
      if (res.ok) {
        const data = await res.json();
        setDrivers(data);
      }
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    }
  };

  useEffect(() => {
    fetchData();
    if (['owner', 'manager', 'admin'].includes(user?.role)) {
      fetchDrivers();
    }
    const interval = setInterval(fetchData, 30000); 
    return () => clearInterval(interval);
  }, []);

  const handleAdvanceItem = async (itemId) => {
    setUpdatingItem(itemId);
    try {
      const res = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });
      if (res.ok) {
        await fetchData(); // Refresh whole workflow
      }
    } catch (err) {
      console.error('Failed to update item:', err);
    } finally {
      setUpdatingItem(null);
    }
  };

  const toggleTask = async (taskId, currentStatus) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, is_completed: !currentStatus })
      });
      if (res.ok) {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, is_completed: !currentStatus } : t));
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleAssignDriver = async (orderId, driverId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/logistics`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'delivery', status: 'scheduled', driverId })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to assign driver:', err);
    }
  };

  const getStageItems = (stageKey) => workflow[stageKey] || [];

  // Role-based visible stages
  const isFrontdesk = user?.role === 'frontdesk';
  const isDriver = user?.role === 'driver';
  const isStaff = user?.role === 'staff' || user?.role === 'worker';
  const isProduction = isStaff || ['owner', 'admin', 'manager'].includes(user?.role);
  const isFullAccess = ['owner', 'admin', 'manager'].includes(user?.role);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Broadcast Banner */}
      {activeBroadcast && (
        <div className={`p-4 rounded-xl shadow-lg border animate-fade-in flex items-center gap-4 ${
          activeBroadcast.severity === 'error' ? 'bg-red-600 text-white border-red-700 shadow-red-900/20' :
          activeBroadcast.severity === 'warning' ? 'bg-amber-500 text-white border-amber-600 shadow-amber-900/20' :
          'bg-emerald-600 text-white border-emerald-700 shadow-emerald-900/20'
        }`}>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
               {activeBroadcast.severity === 'error' ? 'emergency_home' : 'campaign'}
            </span>
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-0.5">
               {activeBroadcast.severity === 'error' ? t('global_emergency') : t('system_broadcast')} • {new Date(activeBroadcast.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </h4>
            <p className="font-bold text-sm tracking-tight leading-snug">{activeBroadcast.description.replace(/^Admin Broadcast:\s*/i, '')}</p>
          </div>
          <button onClick={() => setActiveBroadcast(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all shrink-0">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-10 flex justify-between items-end animate-fade-in-up">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-theme-text mb-1 font-headline italic">{t('ops_monitor')}</h2>
          <p className="text-theme-text-muted font-bold tracking-tight">
            {isFrontdesk ? t('retail_service_desc') : isDriver ? t('dispatch_queue_desc') : t('production_stats_desc')}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 rounded-2xl text-primary font-black text-[11px] uppercase tracking-widest border border-primary/20 shadow-lg shadow-primary/5">
            <span className="material-symbols-outlined text-sm">visibility</span>
            {user?.role?.toUpperCase()} {t('mode_active')}
          </div>
        </div>
      </div>

      {/* Dashboard Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Production Queue Observer */}
        <section className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-theme-surface-container p-8 rounded-[3rem] shadow-sm border border-theme-border animate-fade-in-up relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div>
                <h3 className="text-xl font-black flex items-center gap-3 text-theme-text tracking-tighter italic">
                  <span className="material-symbols-outlined text-primary scale-125">monitor</span>
                  {t('production_queue')}
                </h3>
                <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.3em] mt-2 opacity-60">
                   {t('active_workflow_for')} {user?.role || t('identity')}
                </p>
              </div>
            </div>

            {/* Workflow Observer Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[500px] overflow-y-auto lg:overflow-hidden">
              {/* Stage: In-Take (received + sorting) - Visible to Frontdesk and Staff */}
              {(isFrontdesk || isStaff || isFullAccess) && (
                <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between px-3">
                  <span className="text-[11px] font-black text-theme-text-muted uppercase tracking-[0.2em] italic">{t('in_take')}</span>
                  <span className="text-[11px] font-black text-primary bg-primary/10 w-8 h-8 rounded-xl flex items-center justify-center border border-primary/20 shadow-inner">
                    {(getStageItems('received').length + getStageItems('sorting').length).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="space-y-4 overflow-y-auto no-scrollbar pb-4 px-1">
                  {[...getStageItems('received'), ...getStageItems('sorting')].map((item, i) => (
                    <div 
                      key={item.id} 
                      onClick={() => handleAdvanceItem(item.id)}
                      className={`p-5 bg-theme-surface rounded-[2rem] border border-theme-border border-l-4 border-l-primary shadow-sm animate-fade-in-up cursor-pointer hover:border-primary/50 hover:-translate-y-1 active:scale-95 transition-all group relative ${updatingItem === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      {updatingItem === item.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[2rem] z-20 backdrop-blur-sm">
                           <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[11px] font-black text-primary tracking-widest uppercase">{item.order_number}</span>
                        <span className="material-symbols-outlined text-sm text-theme-text-muted opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">arrow_forward</span>
                      </div>
                      <p className="text-base font-black text-theme-text mb-1 tracking-tight">{item.garment_type}</p>
                      <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest opacity-60">{item.service_type}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

              {/* Stage: Processing (washing + dry_cleaning + drying) - Visible to Staff */}
              {(isStaff || isFullAccess) && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between px-3">
                    <span className="text-[11px] font-black text-theme-text-muted uppercase tracking-[0.2em] italic">{t('ops_board')}</span>
                    <span className="text-[11px] font-black text-secondary bg-secondary/10 w-8 h-8 rounded-xl flex items-center justify-center border border-secondary/20 shadow-inner">
                      {(getStageItems('washing').length + getStageItems('dry_cleaning').length + getStageItems('drying').length).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="space-y-4 overflow-y-auto no-scrollbar pb-4 px-1">
                    {[...getStageItems('washing'), ...getStageItems('dry_cleaning'), ...getStageItems('drying')].map((item, i) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleAdvanceItem(item.id)}
                        className={`p-5 bg-theme-surface rounded-[2rem] border border-theme-border border-l-4 border-l-secondary shadow-sm animate-fade-in-up cursor-pointer hover:border-secondary/50 hover:-translate-y-1 active:scale-95 transition-all group relative ${updatingItem === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        {updatingItem === item.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[2rem] z-20 backdrop-blur-sm">
                             <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[11px] font-black text-secondary tracking-widest uppercase">{item.order_number}</span>
                          <span className="material-symbols-outlined text-[16px] text-secondary group-hover:rotate-180 transition-transform duration-500">sync</span>
                        </div>
                        <p className="text-base font-black text-theme-text mb-1 tracking-tight">{item.garment_type}</p>
                        <div className="w-full bg-secondary/10 h-1.5 rounded-full mt-4 overflow-hidden border border-secondary/5">
                          <div className="bg-secondary h-full rounded-full shadow-[0_0_10px_rgba(199,199,188,0.3)] animate-pulse" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stage: Quality (ironing + quality_check) - Visible to Staff */}
              {(isStaff || isFullAccess) && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between px-3">
                    <span className="text-[11px] font-black text-theme-text-muted uppercase tracking-[0.2em] italic">{t('finishing')}</span>
                    <span className="text-[11px] font-black text-emerald-500 bg-emerald-500/10 w-8 h-8 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
                      {(getStageItems('ironing').length + getStageItems('quality_check').length).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="space-y-4 overflow-y-auto no-scrollbar pb-4 px-1">
                    {[...getStageItems('ironing'), ...getStageItems('quality_check')].map((item, i) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleAdvanceItem(item.id)}
                        className={`p-5 bg-theme-surface rounded-[2rem] border border-theme-border border-l-4 border-l-emerald-500 shadow-sm animate-fade-in-up cursor-pointer hover:border-emerald-500/50 hover:-translate-y-1 active:scale-95 transition-all group relative ${updatingItem === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        {updatingItem === item.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[2rem] z-20 backdrop-blur-sm">
                             <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[11px] font-black text-emerald-600 tracking-widest uppercase">{item.order_number}</span>
                          <span className="material-symbols-outlined text-sm text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">check_circle</span>
                        </div>
                        <p className="text-base font-black text-theme-text mb-1 tracking-tight">{item.garment_type}</p>
                        <div className="flex items-center gap-2 mt-3 p-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                          <span className="material-symbols-outlined text-emerald-500 text-[16px]">verified</span>
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">QC Induction</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stage: Logistics (Ready items for Dispatch) - Visible to Driver and Production */}
              {(isDriver || isProduction) && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between px-3">
                    <span className="text-[11px] font-black text-theme-text-muted uppercase tracking-[0.2em] italic">{t('logistics_dispatch')}</span>
                    <span className="text-[11px] font-black text-blue-500 bg-blue-500/10 w-8 h-8 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-inner">
                      {getStageItems('ready').filter(i => i.delivery_status === 'pending').length.toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="space-y-4 overflow-y-auto no-scrollbar pb-4 px-1">
                    {getStageItems('ready').filter(i => i.delivery_status === 'pending').map((item, i) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleAdvanceItem(item.id)}
                        className={`p-5 bg-theme-surface rounded-[2rem] border border-theme-border border-l-4 border-l-blue-500 shadow-sm animate-fade-in-up cursor-pointer hover:border-blue-500/50 hover:-translate-y-1 active:scale-95 transition-all group relative ${updatingItem === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[11px] font-black text-blue-600 tracking-widest uppercase">{item.order_number}</span>
                          <span className="material-symbols-outlined text-sm text-blue-500">local_shipping</span>
                        </div>
                        <p className="text-base font-black text-theme-text mb-1 tracking-tight">{item.garment_type}</p>
                        
                        {isFullAccess && (
                          <div className="mt-4 pt-4 border-t border-theme-border/30">
                            <select 
                              onChange={(e) => handleAssignDriver(item.order_id, e.target.value)}
                              className="w-full bg-theme-surface border border-theme-border rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-theme-text-muted outline-none focus:border-primary transition-colors"
                              value={item.driver_id || ""}
                            >
                              <option value="">{item.driver_id ? 'Reassign Driver' : 'Assign Driver'}</option>
                              {drivers.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex items-center gap-1 mt-3">
                           <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] bg-blue-500/5 px-3 py-1 rounded-xl border border-blue-500/10">Dispatch Ready</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stage: Retail Check (Pickup) - Visible to Frontdesk and Admins */}
              {(isFrontdesk || isFullAccess) && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between px-3">
                    <span className="text-[11px] font-black text-theme-text-muted uppercase tracking-[0.2em] italic">{t('retail_queue')}</span>
                    <span className="text-[11px] font-black text-primary bg-primary/10 w-8 h-8 rounded-xl flex items-center justify-center border border-primary/20 shadow-inner">
                      {getStageItems('ready').length.toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="space-y-4 overflow-y-auto no-scrollbar pb-4 px-1">
                    {getStageItems('ready').map((item, i) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleAdvanceItem(item.id)}
                        className={`p-5 bg-theme-surface rounded-[2rem] border border-theme-border border-l-4 border-l-primary shadow-sm animate-fade-in-up cursor-pointer hover:border-primary/50 hover:-translate-y-1 active:scale-95 transition-all group relative ${updatingItem === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        {updatingItem === item.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[2rem] z-20 backdrop-blur-sm">
                             <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[11px] font-black text-primary tracking-widest uppercase">{item.order_number}</span>
                          <span className="material-symbols-outlined text-sm text-primary group-hover:scale-125 transition-transform">shopping_bag</span>
                        </div>
                        <p className="text-base font-black text-theme-text mb-1 tracking-tight">{item.garment_type}</p>
                        <div className="flex items-center gap-1 mt-3">
                           <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-3 py-1 rounded-xl border border-primary/10">{item.customer_name || 'Retail Client'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Machine Fleet Status Observer */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'Washer 01', type: 'Active', cycle: 'Standard Cycle', time: '18:42', status: 'active', icon: 'local_laundry_service' },
              { id: 'Washer 02', type: 'Ready', cycle: 'Optimal Load', time: '--:--', status: 'idle', icon: 'local_laundry_service' },
              { id: 'Dryer 01', type: 'Active', cycle: 'High Heat', time: '12:00', status: 'active', icon: 'mode_fan' },
              { id: 'Dryer 02', type: 'Idle', cycle: 'No load', time: '--:--', status: 'maintenance', icon: 'mode_fan' },
            ].map((machine, i) => (
              <div key={i} className="p-5 rounded-[2.5rem] border border-theme-border bg-theme-surface shadow-sm animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex justify-between mb-4">
                  <span className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.2em]">{machine.id}</span>
                  <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px] ${machine.status === 'active' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-theme-border'}`}></div>
                </div>
                <span className="material-symbols-outlined text-theme-text-muted text-2xl mb-3 opacity-40">{machine.icon}</span>
                <p className="text-[11px] font-black text-theme-text uppercase tracking-widest mb-1 italic opacity-80">{machine.type}</p>
                <div className="text-2xl font-black tracking-tighter text-theme-text">{machine.time}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Sidebar: Shift Tasks & Status */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          {/* Shift Checklist (FUNCTIONAL) */}
          <div className="bg-theme-surface-container p-8 rounded-[3rem] border border-theme-border animate-fade-in-up">
            <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-theme-text italic tracking-tighter">
              <span className="material-symbols-outlined text-primary scale-110">assignment</span>
              {t('shift_objectives')}
            </h3>
            <div className="space-y-5 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
              {tasks.length === 0 ? (
                <p className="text-xs font-black text-theme-text-muted text-center py-6 opacity-40 uppercase tracking-widest">{t('no_tasks_assigned')}</p>
              ) : tasks.map((item, i) => (
                <label key={item.id} className="flex items-center gap-5 group cursor-pointer animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div 
                    onClick={() => toggleTask(item.id, item.is_completed)}
                    className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${item.is_completed ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'border-theme-border bg-theme-surface group-hover:border-primary/50'}`}
                  >
                    {item.is_completed && <span className="material-symbols-outlined text-base font-black">check</span>}
                  </div>
                  <span className={`text-sm font-black tracking-tight transition-colors ${item.is_completed ? 'line-through text-theme-text-muted opacity-40' : 'text-theme-text group-hover:text-primary'}`}>
                    {item.task_description}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Shift Metrics (Visible) */}
          <div className="bg-theme-surface-container p-8 rounded-[3rem] border border-theme-border animate-fade-in-up">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-theme-text-muted mb-8 opacity-60 italic">{t('floor_intelligence')}</h3>
            <div className="space-y-8">
              <div>
                <div className="flex justify-between mb-3 items-end">
                  <span className="text-[11px] font-black text-theme-text uppercase tracking-widest">{t('shift_completion')}</span>
                  <span className="text-xl font-black text-primary tracking-tighter">
                    {tasks.length > 0 ? Math.round((tasks.filter(t => t.is_completed).length / tasks.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-theme-surface h-2.5 rounded-full overflow-hidden border border-theme-border">
                  <div className="bg-primary h-full transition-all duration-700 shadow-[0_0_15px_rgba(16,185,129,0.4)]" style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.is_completed).length / tasks.length) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="p-5 bg-theme-surface rounded-[2rem] border border-theme-border">
                  <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest mb-2 opacity-60">{t('cycle_yield')}</p>
                  <p className="text-3xl font-black text-theme-text tracking-tighter italic">124</p>
                </div>
                <div className="p-5 bg-theme-surface rounded-[2rem] border border-theme-border">
                  <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest mb-2 opacity-60">{t('live_items')}</p>
                  <p className="text-3xl font-black text-primary tracking-tighter italic">
                    {[...Object.values(workflow)].flat().filter(i => i.status !== 'ready').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Alerts (Static) */}
          <div className="bg-red-600/10 text-red-500 p-8 rounded-[3rem] border border-red-500/20 relative group animate-fade-in-up overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <span className="material-symbols-outlined text-6xl rotate-12">warning</span>
            </div>
            <div className="relative z-10 font-black">
              <h3 className="text-lg font-black mb-5 flex items-center gap-3 tracking-tighter italic">
                <span className="material-symbols-outlined scale-110" style={{ fontVariationSettings: "'FILL' 1" }}>priority_high</span>
                {t('critical_alerts')}
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-red-600/5 rounded-[1.5rem] border border-red-500/10">
                  <p className="text-[10px] uppercase tracking-widest mb-2 opacity-80">Equipment Fault</p>
                  <p className="text-sm tracking-tight font-black text-red-400">Dryer 04: Heat sensor error. Manual override blocked.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
