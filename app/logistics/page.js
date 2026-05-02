'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/lib/UserContext';
import { useRouter } from 'next/navigation';
import SignaturePad from '@/components/logistics/SignaturePad';
import PhotoCapture from '@/components/logistics/PhotoCapture';
import LogisticsMap from '@/components/logistics/LogisticsMap';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function LogisticsDashboard() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useUser();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSignature, setShowSignature] = useState(null); // stores {id, type}
  const [showPhoto, setShowPhoto] = useState(null); // stores {id, type}
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

  const handleAction = async (id, type, newStatus, extraData = {}) => {
    try {
      const res = await fetch(`/api/orders/${id}/logistics`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type, 
          status: newStatus,
          ...extraData,
          driverId: user?.id
        })
      });
      if (res.ok) {
        fetchTasks();
        setShowSignature(null);
        setShowPhoto(null);
      }
    } catch (err) {
      console.error('Action failed', err);
    }
  };

  if (authLoading || loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-theme-surface-container p-8">
      <div className="w-16 h-16 rounded-full border-4 border-emerald-900 border-t-emerald-400 animate-spin mb-6"></div>
      <p className="text-sm font-black text-theme-text-muted uppercase tracking-widest animate-pulse">{t('initializing_dispatch')}</p>
    </div>
  );

  // Clustering Logic: Group by the first part of the address (neighborhood-ish)
  const clusterTasks = (taskList) => {
    const clusters = {};
    taskList.forEach(task => {
      const area = (task.customer_address || 'Other').split(',').slice(-2, -1)[0]?.trim() || 'General';
      if (!clusters[area]) clusters[area] = [];
      clusters[area].push(task);
    });
    return Object.entries(clusters).sort((a, b) => b[1].length - a[1].length);
  };

  const pendingPickups = tasks.filter(t => ['pending', 'scheduled', 'in_transit'].includes(t.pickup_status));
  const pendingDeliveries = tasks.filter(t => ['pending', 'scheduled', 'in_transit'].includes(t.delivery_status));

  const pickupClusters = clusterTasks(pendingPickups);
  const deliveryClusters = clusterTasks(pendingDeliveries);

  return (
    <div className="min-h-screen bg-background text-theme-text p-4 lg:p-8 font-sans selection:bg-theme-surface-container/30 selection:text-emerald-200">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-theme-surface/70 border border-theme-border p-8 rounded-[3rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-theme-surface-container/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 rounded-3xl bg-theme-surface-container shadow-[0_0_50px_rgba(16,185,129,0.3)] text-theme-text flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-3xl">local_shipping</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="w-2 h-2 rounded-full bg-theme-surface-container animate-pulse"></span>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">{t('fleet_active')} • {user?.name} {t('dispatch')}</span>
              </div>
              <h1 className="text-4xl font-black text-theme-text tracking-tighter">{t('logistics_hub')}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
             <div className="bg-theme-surface-container px-6 py-4 rounded-3xl border border-theme-border text-center flex-1 md:flex-none">
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">{t('pickups')}</p>
                <p className="text-2xl font-black text-theme-text leading-none">{pendingPickups.length}</p>
             </div>
             <div className="bg-theme-surface-container px-6 py-4 rounded-3xl border border-theme-border text-center flex-1 md:flex-none">
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">{t('deliveries')}</p>
                <p className="text-2xl font-black text-theme-text leading-none">{pendingDeliveries.length}</p>
             </div>
          </div>
        </div>

        {/* Live Logistics Map */}
        <LogisticsMap tasks={tasks} />

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Pickups Column */}
          <div className="space-y-6">
            <h2 className="text-sm font-black text-theme-text-muted uppercase tracking-[0.3em] pl-4 flex items-center gap-3">
               <span className="material-symbols-outlined text-amber-500">assignment_return</span>
               {t('pending_pickups')}
            </h2>
            <div className="space-y-10">
              {pickupClusters.length === 0 ? (
                <div className="p-12 text-center bg-theme-surface/50 rounded-[3rem] border border-dashed border-theme-border">
                  <span className="material-symbols-outlined text-4xl text-theme-text mb-4">task_alt</span>
                  <p className="text-xs font-black text-theme-text-muted uppercase tracking-widest">{t('no_pending_pickups')}</p>
                </div>
              ) : pickupClusters.map(([area, areaTasks]) => (
                <div key={area} className="space-y-4">
                  <div className="flex items-center gap-4 pl-4 mb-2">
                    <span className="h-[1px] flex-1 bg-theme-border"></span>
                    <span className="text-[11px] font-black text-theme-text-muted uppercase tracking-widest whitespace-nowrap bg-theme-surface-container px-4 py-1.5 rounded-full border border-theme-border">
                      {t('neighborhood')}: {area}
                    </span>
                    <span className="h-[1px] flex-1 bg-theme-border"></span>
                  </div>
                  {areaTasks.map((task, i) => (
                    <div key={'p-'+task.id} className="bg-theme-surface border border-theme-border rounded-[2.5rem] p-6 hover:border-theme-border transition-colors shadow-sm animate-scale-in">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="flex gap-2">
                             <span className="text-[10px] font-black bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-amber-500/20">
                              {t(task.pickup_status)}
                            </span>
                            {task.driver_id ? (
                               <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-emerald-500/20">{t('assigned')}</span>
                            ) : (
                               <span className="text-[10px] font-black bg-slate-500/10 text-slate-500 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-slate-500/20">{t('unassigned')}</span>
                            )}
                          </div>
                          <h3 className="text-xl font-black text-theme-text mt-3 leading-tight">{task.customer_name}</h3>
                          <p className="text-xs font-bold text-theme-text-muted flex items-center gap-1.5 mt-1">
                            <span className="material-symbols-outlined text-[14px]">call</span> {task.customer_phone}
                          </p>
                        </div>
                        <span className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest">#{task.order_number}</span>
                      </div>
                      
                      <div className="bg-theme-surface-container rounded-3xl p-5 mb-4 border border-theme-border/50 flex gap-4">
                        <span className="material-symbols-outlined text-theme-text-muted mt-0.5">location_on</span>
                        <p className="text-sm font-bold text-theme-text leading-relaxed">{task.customer_address}</p>
                      </div>
                      
                      <div className="flex gap-3">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.customer_address || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 flex-1 mb-4 py-2.5 rounded-2xl border border-theme-border bg-theme-surface-container hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-theme-text-muted font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">map</span>
                          Maps
                        </a>
                        {!task.driver_id && (
                          <button 
                            onClick={() => handleAction(task.id, 'pickup', task.pickup_status)}
                            className="flex-[2] mb-4 py-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white text-emerald-600 font-black text-[10px] uppercase tracking-widest transition-all"
                          >
                            {t('assign_to_me')}
                          </button>
                        )}
                      </div>

                      <div className="flex gap-3">
                        {task.pickup_status === 'pending' || task.pickup_status === 'scheduled' ? (
                          <button 
                            disabled={!task.driver_id}
                            onClick={() => handleAction(task.id, 'pickup', 'in_transit')}
                            className={`flex-1 rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest transition-all ${task.driver_id ? 'bg-amber-600 hover:bg-amber-500 text-theme-text' : 'bg-theme-border text-theme-text-muted cursor-not-allowed'}`}
                          >
                            {t('start_route')}
                          </button>
                        ) : (
                          <button 
                            onClick={() => setShowSignature({id: task.id, type: 'pickup'})}
                            className="flex-1 bg-emerald-600 hover:brightness-110 text-theme-text rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                          >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span> {t('mark_collected')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Deliveries Column */}
          <div className="space-y-6">
            <h2 className="text-sm font-black text-theme-text-muted uppercase tracking-[0.3em] pl-4 flex items-center gap-3">
               <span className="material-symbols-outlined text-emerald-500">local_shipping</span>
               {t('pending_deliveries')}
            </h2>
            <div className="space-y-10">
              {deliveryClusters.length === 0 ? (
                <div className="p-12 text-center bg-theme-surface/50 rounded-[3rem] border border-dashed border-theme-border">
                  <span className="material-symbols-outlined text-4xl text-theme-text mb-4">task_alt</span>
                  <p className="text-xs font-black text-theme-text-muted uppercase tracking-widest">{t('no_pending_deliveries')}</p>
                </div>
              ) : deliveryClusters.map(([area, areaTasks]) => (
                <div key={area} className="space-y-4">
                  <div className="flex items-center gap-4 pl-4 mb-2">
                    <span className="h-[1px] flex-1 bg-theme-border"></span>
                    <span className="text-[11px] font-black text-theme-text-muted uppercase tracking-widest whitespace-nowrap bg-theme-surface-container px-4 py-1.5 rounded-full border border-theme-border">
                      Neighborhood: {area}
                    </span>
                    <span className="h-[1px] flex-1 bg-theme-border"></span>
                  </div>
                  {areaTasks.map((task, i) => (
                    <div key={'d-'+task.id} className="bg-theme-surface border border-theme-border rounded-[2.5rem] p-6 hover:border-theme-border transition-colors shadow-sm animate-scale-in">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="flex gap-2">
                            <span className="text-[10px] font-black bg-theme-surface-container/10 text-emerald-400 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-emerald-500/20">
                              {t(task.delivery_status)}
                            </span>
                            {task.driver_id ? (
                               <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-emerald-500/20">{t('assigned')}</span>
                            ) : (
                               <span className="text-[10px] font-black bg-slate-500/10 text-slate-500 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-slate-500/20">{t('unassigned')}</span>
                            )}
                          </div>
                          <h3 className="text-xl font-black text-theme-text mt-3 leading-tight">{task.customer_name}</h3>
                          <p className="text-xs font-bold text-theme-text-muted flex items-center gap-1.5 mt-1">
                            <span className="material-symbols-outlined text-[14px]">call</span> {task.customer_phone}
                          </p>
                        </div>
                        <span className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest">#{task.order_number}</span>
                      </div>
                      
                      <div className="bg-theme-surface-container rounded-3xl p-5 mb-4 border border-theme-border/50 flex gap-4">
                        <span className="material-symbols-outlined text-emerald-600/50 mt-0.5">location_on</span>
                        <p className="text-sm font-bold text-theme-text leading-relaxed">{task.customer_address}</p>
                      </div>
                      
                      <div className="flex gap-3">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.customer_address || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 flex-1 mb-4 py-2.5 rounded-2xl border border-theme-border bg-theme-surface-container hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-theme-text-muted font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">map</span>
                          Maps
                        </a>
                        {!task.driver_id && (
                          <button 
                            onClick={() => handleAction(task.id, 'delivery', task.delivery_status)}
                            className="flex-[2] mb-4 py-2.5 rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500 hover:text-white text-blue-600 font-black text-[10px] uppercase tracking-widest transition-all"
                          >
                            {t('assign_to_me')}
                          </button>
                        )}
                      </div>

                      <div className="flex gap-3">
                        {task.delivery_status === 'pending' || task.delivery_status === 'scheduled' ? (
                          <button 
                            disabled={!task.driver_id}
                            onClick={() => handleAction(task.id, 'delivery', 'in_transit')}
                            className={`flex-1 rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest transition-all ${task.driver_id ? 'bg-blue-600 hover:bg-blue-500 text-theme-text' : 'bg-theme-border text-theme-text-muted cursor-not-allowed'}`}
                          >
                            {t('start_route')}
                          </button>
                        ) : (
                          <button 
                            onClick={() => setShowPhoto({id: task.id, type: 'delivery'})}
                            className="flex-1 bg-emerald-600 hover:brightness-110 text-theme-text rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                          >
                            <span className="material-symbols-outlined text-[16px]">verified</span> {t('confirm_delivery')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Logic Modals */}
      {showSignature && (
        <SignaturePad 
          onSave={(sigData) => {
            handleAction(showSignature.id, showSignature.type, 'completed', { signature: sigData });
          }}
          onCancel={() => setShowSignature(null)}
        />
      )}

      {showPhoto && (
        <PhotoCapture 
          onCapture={(photoURL) => {
            // For delivery, we usually want BOTH photo and then maybe a signature.
            // But let's simplify: completing delivery requires signature, but photo is optional/stored alongside.
            // Actually, let's just use photo as the completion trigger for deliveries.
            handleAction(showPhoto.id, showPhoto.type, 'completed', { photo: photoURL });
          }}
          onCancel={() => setShowPhoto(null)}
        />
      )}

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
