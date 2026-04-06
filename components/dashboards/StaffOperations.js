'use client';

import React, { useState, useEffect } from 'react';

export default function StaffOperations({ user }) {
  const [workflow, setWorkflow] = useState({});
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [activeBroadcast, setActiveBroadcast] = useState(null);

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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleAdvanceItem = async (itemId) => {
    setUpdatingItem(itemId);
    try {
      const res = await fetch('/api/workflow/update', {
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
               {activeBroadcast.severity === 'error' ? 'Global Emergency Transmit' : 'System Broadcast'} • {new Date(activeBroadcast.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1 font-headline">Operations Monitor</h2>
          <p className="text-on-surface-variant font-medium">
            {isFrontdesk ? 'Customer In-take & Retail Service' : isDriver ? 'Logistics & Dispatch Queue' : 'BOH Workflow & Live Production Stats'}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl text-emerald-700 font-bold text-sm shadow-sm border border-emerald-100/30">
            <span className="material-symbols-outlined text-sm status-dot-pulse">visibility</span>
            {user?.role?.toUpperCase()} Mode Active
          </div>
        </div>
      </div>

      {/* Dashboard Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Production Queue Observer */}
        <section className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/10 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600">monitor</span>
                  Production Queue
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Active workflow for your current role
                </p>
              </div>
            </div>

            {/* Workflow Observer Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[500px] overflow-y-auto lg:overflow-hidden">
              {/* Stage: In-Take (received + sorting) - Visible to Frontdesk and Staff */}
              {(isFrontdesk || isStaff || isFullAccess) && (
                <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">In-Take</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 w-6 h-6 rounded-lg flex items-center justify-center">
                    {(getStageItems('received').length + getStageItems('sorting').length).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="space-y-3 overflow-y-auto no-scrollbar pb-4">
                  {[...getStageItems('received'), ...getStageItems('sorting')].map((item, i) => (
                    <div 
                      key={item.id} 
                      onClick={() => handleAdvanceItem(item.id)}
                      className={`p-4 bg-surface rounded-2xl border-l-4 border-emerald-500 shadow-sm animate-fade-in-up cursor-pointer hover:scale-[1.02] active:scale-95 transition-all group relative ${updatingItem === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      {updatingItem === item.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/40 rounded-2xl z-20">
                           <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-extrabold text-primary">{item.order_number}</span>
                        <span className="material-symbols-outlined text-sm text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                      </div>
                      <p className="text-sm font-bold text-on-surface mb-1">{item.garment_type}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.service_type}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

              {/* Stage: Processing (washing + dry_cleaning + drying) - Visible to Staff */}
              {(isStaff || isFullAccess) && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Processing</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 w-6 h-6 rounded-lg flex items-center justify-center">
                      {(getStageItems('washing').length + getStageItems('dry_cleaning').length + getStageItems('drying').length).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="space-y-3 overflow-y-auto no-scrollbar pb-4">
                    {[...getStageItems('washing'), ...getStageItems('dry_cleaning'), ...getStageItems('drying')].map((item, i) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleAdvanceItem(item.id)}
                        className={`p-4 bg-emerald-50/20 rounded-2xl border-l-4 border-secondary shadow-sm animate-fade-in-up cursor-pointer hover:scale-[1.02] active:scale-95 transition-all group relative ${updatingItem === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        {updatingItem === item.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/40 rounded-2xl z-20">
                             <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-extrabold text-secondary">{item.order_number}</span>
                          <span className="material-symbols-outlined text-[14px] text-secondary group-hover:animate-spin">sync</span>
                        </div>
                        <p className="text-sm font-bold text-on-surface mb-1">{item.garment_type}</p>
                        <div className="w-full bg-secondary/10 h-1.5 rounded-full mt-3 overflow-hidden">
                          <div className="bg-secondary h-full rounded-full" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stage: Quality (ironing + quality_check) - Visible to Staff */}
              {(isStaff || isFullAccess) && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Finishing</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 w-6 h-6 rounded-lg flex items-center justify-center">
                      {(getStageItems('ironing').length + getStageItems('quality_check').length).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="space-y-3 overflow-y-auto no-scrollbar pb-4">
                    {[...getStageItems('ironing'), ...getStageItems('quality_check')].map((item, i) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleAdvanceItem(item.id)}
                        className={`p-4 bg-surface rounded-2xl border-l-4 border-emerald-300 shadow-sm animate-fade-in-up cursor-pointer hover:scale-[1.02] active:scale-95 transition-all group relative ${updatingItem === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        {updatingItem === item.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/40 rounded-2xl z-20">
                             <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-extrabold text-emerald-700">{item.order_number}</span>
                          <span className="material-symbols-outlined text-sm text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">check_circle</span>
                        </div>
                        <p className="text-sm font-bold text-on-surface mb-1">{item.garment_type}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <span className="material-symbols-outlined text-emerald-500 text-[14px]">verified</span>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase">QC Stage</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stage: Logistics (Ready items for Dispatch) - Visible to Driver and Production */}
              {(isDriver || isProduction) && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Logistics Dispatch</span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 w-6 h-6 rounded-lg flex items-center justify-center">
                      {getStageItems('ready').filter(i => i.delivery_status === 'pending').length.toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="space-y-3 overflow-y-auto no-scrollbar pb-4">
                    {getStageItems('ready').filter(i => i.delivery_status === 'pending').map((item, i) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleAdvanceItem(item.id)}
                        className={`p-4 bg-blue-50/20 rounded-2xl border-l-4 border-blue-500 shadow-sm animate-fade-in-up cursor-pointer hover:scale-[1.02] active:scale-95 transition-all group relative ${updatingItem === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-extrabold text-blue-700">{item.order_number}</span>
                          <span className="material-symbols-outlined text-sm text-blue-500">local_shipping</span>
                        </div>
                        <p className="text-sm font-bold text-on-surface mb-1">{item.garment_type}</p>
                        <div className="flex items-center gap-1 mt-2">
                           <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-100/50 px-2 py-0.5 rounded">Dispatch Ready</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stage: Retail Check (Pickup) - Visible to Frontdesk and Admins */}
              {(isFrontdesk || isFullAccess) && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Retail Queue</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 w-6 h-6 rounded-lg flex items-center justify-center">
                      {getStageItems('ready').length.toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="space-y-3 overflow-y-auto no-scrollbar pb-4">
                    {getStageItems('ready').map((item, i) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleAdvanceItem(item.id)}
                        className={`p-4 bg-primary/5 rounded-2xl border-l-4 border-primary shadow-sm animate-fade-in-up cursor-pointer hover:scale-[1.02] active:scale-95 transition-all group relative ${updatingItem === item.id ? 'opacity-50 pointer-events-none' : ''}`}
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        {updatingItem === item.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/40 rounded-2xl z-20">
                             <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-extrabold text-primary">{item.order_number}</span>
                          <span className="material-symbols-outlined text-sm text-primary group-hover:animate-bounce">shopping_bag</span>
                        </div>
                        <p className="text-sm font-bold text-on-surface mb-1">{item.garment_type}</p>
                        <div className="flex items-center gap-1 mt-2">
                           <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">{item.customer_name || 'Retail Client'}</span>
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
              <div key={i} className="p-4 rounded-3xl border border-outline-variant/10 bg-white opacity-80 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex justify-between mb-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{machine.id}</span>
                  <div className={`w-2 h-2 rounded-full ${machine.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-xl mb-2">{machine.icon}</span>
                <p className="text-xs font-black text-on-surface uppercase tracking-tight">{machine.type}</p>
                <div className="text-lg font-black tracking-tighter text-on-surface mt-2">{machine.time}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Sidebar: Shift Tasks & Status */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          {/* Shift Checklist (FUNCTIONAL) */}
          <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10 animate-fade-in-up">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">assignment</span>
              My Shift Tasks
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
              {tasks.length === 0 ? (
                <p className="text-xs font-medium text-slate-400 text-center py-4">No tasks assigned for today.</p>
              ) : tasks.map((item, i) => (
                <label key={item.id} className="flex items-center gap-4 group cursor-pointer animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div 
                    onClick={() => toggleTask(item.id, item.is_completed)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.is_completed ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'border-emerald-300 group-hover:bg-emerald-50 group-hover:border-emerald-400'}`}
                  >
                    {item.is_completed && <span className="material-symbols-outlined text-sm font-extrabold">check</span>}
                  </div>
                  <span className={`text-sm font-semibold transition-colors ${item.is_completed ? 'line-through text-slate-400' : 'text-on-surface group-hover:text-emerald-700'}`}>
                    {item.task_description}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Shift Metrics (Visible) */}
          <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10 animate-fade-in-up">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Floor Metrics</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-on-surface">Shift Completion</span>
                  <span className="text-xs font-bold text-emerald-600">
                    {tasks.length > 0 ? Math.round((tasks.filter(t => t.is_completed).length / tasks.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-white/50 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.is_completed).length / tasks.length) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-outline-variant/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Items Out</p>
                  <p className="text-xl font-black text-on-surface">124</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-outline-variant/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Active items</p>
                  <p className="text-xl font-black text-emerald-600">
                    {[...Object.values(workflow)].flat().filter(i => i.status !== 'ready').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Alerts (Static) */}
          <div className="bg-emerald-900 text-white p-6 rounded-3xl shadow-xl overflow-hidden relative group animate-fade-in-up">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontVariationSettings: "'FILL' 1" }}>priority_high</span>
                Critical Alerts
              </h3>
              <div className="space-y-4">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
                  <p className="text-[10px] font-bold uppercase text-emerald-300 tracking-widest mb-1">Equipment</p>
                  <p className="text-xs font-semibold">Dryer 04: Heat sensor error. Check required.</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl"></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
