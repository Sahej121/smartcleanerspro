'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/lib/UserContext';
import { useRouter } from 'next/navigation';

export default function LogisticsDashboard() {
  const { user, loading: authLoading } = useUser();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/logistics');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, type, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${id}/logistics`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, status: newStatus })
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error('Action failed', err);
    }
  };

  if (authLoading || loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8">
      <div className="w-16 h-16 rounded-full border-4 border-emerald-900 border-t-emerald-400 animate-spin mb-6"></div>
      <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Initializing Dispatch...</p>
    </div>
  );

  const pendingPickups = tasks.filter(t => ['pending', 'scheduled', 'in_transit'].includes(t.pickup_status));
  const pendingDeliveries = tasks.filter(t => ['pending', 'scheduled', 'in_transit'].includes(t.delivery_status));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 p-4 lg:p-8 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/70 border border-slate-200 p-8 rounded-[3rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] text-slate-900 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-3xl">local_shipping</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Fleet Active</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Logistics Hub</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
             <div className="bg-slate-50 px-6 py-4 rounded-3xl border border-slate-200 text-center flex-1 md:flex-none">
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Pickups</p>
                <p className="text-2xl font-black text-slate-900 leading-none">{pendingPickups.length}</p>
             </div>
             <div className="bg-slate-50 px-6 py-4 rounded-3xl border border-slate-200 text-center flex-1 md:flex-none">
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Deliveries</p>
                <p className="text-2xl font-black text-slate-900 leading-none">{pendingDeliveries.length}</p>
             </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Pickups Column */}
          <div className="space-y-6">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] pl-4">Pending Pickups</h2>
            <div className="space-y-4">
              {pendingPickups.length === 0 ? (
                <div className="p-12 text-center bg-white/50 rounded-[3rem] border border-dashed border-slate-200">
                  <span className="material-symbols-outlined text-4xl text-slate-700 mb-4">task_alt</span>
                  <p className="text-xs font-black text-slate-600 uppercase tracking-widest">No pending pickups</p>
                </div>
              ) : pendingPickups.map((task, i) => (
                <div key={'p-'+task.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 hover:border-slate-700 transition-colors shadow-sm animate-scale-in" style={{ animationDelay: (i * 50) + 'ms' }}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] font-black bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-amber-500/20">
                        {task.pickup_status}
                      </span>
                      <h3 className="text-xl font-black text-slate-900 mt-3 leading-tight">{task.customer_name}</h3>
                      <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-1">
                        <span className="material-symbols-outlined text-[14px]">call</span> {task.customer_phone}
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">#{task.order_number}</span>
                  </div>
                  
                  <div className="bg-slate-50 rounded-3xl p-5 mb-4 border border-slate-200/50 flex gap-4">
                    <span className="material-symbols-outlined text-slate-600 mt-0.5">location_on</span>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{task.customer_address}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.customer_address || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full mb-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-100 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-slate-600 font-black text-[10px] uppercase tracking-widest transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="material-symbols-outlined text-[16px]">map</span>
                    View on Google Maps
                  </a>

                  <div className="flex gap-3">
                    {task.pickup_status === 'pending' || task.pickup_status === 'scheduled' ? (
                      <button 
                        onClick={() => handleAction(task.id, 'pickup', 'in_transit')}
                        className="flex-1 bg-amber-600 hover:bg-amber-500 text-slate-900 rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Start Route
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleAction(task.id, 'pickup', 'completed')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-900 rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span> Mark Collected
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deliveries Column */}
          <div className="space-y-6">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] pl-4">Pending Deliveries</h2>
            <div className="space-y-4">
              {pendingDeliveries.length === 0 ? (
                <div className="p-12 text-center bg-white/50 rounded-[3rem] border border-dashed border-slate-200">
                  <span className="material-symbols-outlined text-4xl text-slate-700 mb-4">task_alt</span>
                  <p className="text-xs font-black text-slate-600 uppercase tracking-widest">No pending deliveries</p>
                </div>
              ) : pendingDeliveries.map((task, i) => (
                <div key={'d-'+task.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 hover:border-slate-700 transition-colors shadow-sm animate-scale-in" style={{ animationDelay: (i * 50) + 'ms' }}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-emerald-500/20">
                        {task.delivery_status}
                      </span>
                      <h3 className="text-xl font-black text-slate-900 mt-3 leading-tight">{task.customer_name}</h3>
                      <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-1">
                        <span className="material-symbols-outlined text-[14px]">call</span> {task.customer_phone}
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">#{task.order_number}</span>
                  </div>
                  
                  <div className="bg-slate-50 rounded-3xl p-5 mb-4 border border-slate-200/50 flex gap-4">
                    <span className="material-symbols-outlined text-emerald-600/50 mt-0.5">location_on</span>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{task.customer_address}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.customer_address || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full mb-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-100 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-slate-600 font-black text-[10px] uppercase tracking-widest transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="material-symbols-outlined text-[16px]">map</span>
                    View on Google Maps
                  </a>

                  <div className="flex gap-3">
                    {task.delivery_status === 'pending' || task.delivery_status === 'scheduled' ? (
                      <button 
                        onClick={() => handleAction(task.id, 'delivery', 'in_transit')}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-slate-900 rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Start Route
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleAction(task.id, 'delivery', 'completed')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-900 rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                      >
                        <span className="material-symbols-outlined text-[16px]">verified</span> Confirm Delivery
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .animate-scale-in {
          animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}} />
    </div>
  );
}
