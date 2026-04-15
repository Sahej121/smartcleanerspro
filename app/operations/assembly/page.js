'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useUser, ROLES } from '@/lib/UserContext';
import { hasFeature, TIERS } from '@/lib/tier-config';

// Premium Visual Constants
const STAGE_LABELS = {
  received: 'Received', sorting: 'Sorting', washing: 'Washing',
  dry_cleaning: 'Dry Cleaning', drying: 'Drying', ironing: 'Ironing',
  quality_check: 'Quality Check', ready: 'Ready', delivered: 'Delivered',
};

const STATIONS = [
  { id: 'S1', name: 'Sorting Area A', icon: 'category' },
  { id: 'W1', name: 'Washer 01 (Heavy)', icon: 'local_laundry_service' },
  { id: 'W2', name: 'Washer 02 (Delicate)', icon: 'local_laundry_service' },
  { id: 'D1', name: 'Dryer 01', icon: 'air' },
  { id: 'I1', name: 'Ironing Station A', icon: 'iron' },
  { id: 'Q1', name: 'QC / Finishing', icon: 'fact_check' },
  { id: 'PK', name: 'Packing & Bagging', icon: 'inventory_2' },
];

export default function PremiumAssemblyPage() {
  const { user, role, loading: authLoading } = useUser();
  const [data, setData] = useState({ active: [], completed: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [station, setStation] = useState(null);
  const [scanValue, setScanValue] = useState('');
  const [scanStatus, setScanStatus] = useState(null); 
  const [checklist, setChecklist] = useState(null); 
  
  const scanInputRef = useRef(null);

  useEffect(() => {
    const savedStationId = localStorage.getItem('cleanflow_station_id');
    if (savedStationId) {
      const found = STATIONS.find(s => s.id === savedStationId);
      if (found) setStation(found);
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/workflow/assembly');
      if (!res.ok) {
        console.error('API Error:', res.statusText);
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load assembly workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scanValue.trim()) return;
    if (!station) {
      setScanStatus({ type: 'error', message: 'Select a Station first' });
      return;
    }

    const tagId = scanValue.trim();
    setScanValue('');
    setScanStatus({ type: 'loading', message: 'Scanning...' });

    try {
      const res = await fetch('/api/operations/scan-to-advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_id: tagId, station_id: station.name }),
      });
      
      const result = await res.json();
      if (res.ok) {
        new Audio('/sounds/success.mp3').play().catch(e => console.error('Audio play failed', e));

        setScanStatus({ 
          type: 'success', 
          message: `Advanced ${result.item.garment_type} to ${STAGE_LABELS[result.nextStatus]}`,
          item: result.item
        });
        
        const orderRes = await fetch(`/api/orders/${result.order_id}`);
        const orderData = await orderRes.json();
        setChecklist({
          order_number: result.order_number,
          items: orderData.items,
          scanned_tag: tagId
        });

        fetchData();
        setTimeout(() => setScanStatus(null), 5000);
      } else {
        new Audio('/sounds/error.mp3').play().catch(e => console.error('Audio play failed', e));
        setScanStatus({ type: 'error', message: result.error });
      }
    } catch (err) {
      new Audio('/sounds/error.mp3').play().catch(e => console.error('Audio play failed', e));
      setScanStatus({ type: 'error', message: 'System Error. Check Network.' });
    }
  };

  const selectStation = (s) => {
    setStation(s);
    localStorage.setItem('cleanflow_station_id', s.id);
    setTimeout(() => scanInputRef.current?.focus(), 100);
  };

  // 1. Auth & Feature Gate
  if (authLoading || loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="relative z-10 w-16 h-16 rounded-full border-4 border-theme-border border-t-primary animate-spin mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]"></div>
      <p className="relative z-10 text-sm font-black text-theme-text-muted uppercase tracking-widest animate-pulse">Initializing Control Room</p>
    </div>
  );

  const isPro = user?.role === 'owner' || hasFeature(user?.tier, 'assemblyWorkflow');
  if (!isPro) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden font-sans">
        
        <div className="absolute inset-0 z-0 opacity-10 blur-[8px] pointer-events-none select-none overflow-hidden flex items-center justify-center">
            <div className="w-[800px] h-[600px] border border-theme-border rounded-[4rem] p-12 bg-surface">
              <div className="w-full h-12 bg-theme-surface-container rounded-2xl mb-8"></div>
              <div className="w-full h-32 bg-theme-surface-container rounded-3xl mb-8"></div>
              <div className="w-full h-32 bg-theme-surface-container rounded-3xl"></div>
            </div>
        </div>

        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] animate-breathe"></div>

        <div className="max-w-4xl w-full relative z-10 text-center space-y-12 animate-fade-in-up bg-surface/80 border border-theme-border p-12 rounded-[3.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
           <div className="space-y-6">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-2 shadow-inner">
                <span className="material-symbols-outlined text-sm">workspace_premium</span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Professional Tier Required</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-theme-text tracking-tighter italic leading-none block">
                THE POWER OF <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">PREMIUM ASSEMBLY</span>
              </h1>
              <p className="text-theme-text-muted text-xl max-w-2xl mx-auto leading-relaxed font-bold italic pt-4">
                Unlock the industrial-grade Control Room designed for facilities processing 1,000+ garments daily.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {[
                { title: 'Scan-To-Advance', desc: 'Hardware barcode support for 0.1s stage updates.', icon: 'barcode_scanner' },
                { title: 'Audit Trail', desc: 'Precise worker accountability logs for every scan.', icon: 'history_edu' },
                { title: 'Bottleneck AI', desc: 'Auto-detect late garments stuck in production.', icon: 'analytics' }
              ].map((f, i) => (
                <div key={i} className="p-8 rounded-[2rem] bg-theme-surface-container border border-theme-border group hover:bg-surface hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 shadow-lg hover:shadow-primary/10">
                  <div className="w-12 h-12 rounded-xl primary-gradient text-white flex items-center justify-center mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-full">{f.icon}</span>
                  </div>
                  <h4 className="text-theme-text font-black text-sm uppercase tracking-widest mb-2 italic">{f.title}</h4>
                  <p className="text-xs text-theme-text-muted font-bold leading-relaxed">{f.desc}</p>
                </div>
              ))}
           </div>

           <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 border-t border-theme-border/50">
              <Link 
                href="/admin/billing" 
                className="w-full sm:w-auto px-10 py-5 primary-gradient hover:opacity-90 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-primary/30 active:scale-95 flex items-center justify-center gap-3 group"
              >
                UPGRADE PLATFORM
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">rocket_launch</span>
              </Link>
              <Link 
                href="/operations"
                className="px-8 py-5 rounded-2xl border border-theme-border text-[11px] font-black text-theme-text hover:bg-theme-surface-container uppercase tracking-widest transition-colors active:scale-95"
              >
                Return to Dashboard
              </Link>
           </div>
        </div>
      </div>
    );
  }

  // 2. Station Selector (If not selected)
  if (!station) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 lg:p-12 overflow-hidden selection:bg-primary/30 font-sans">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary rounded-full blur-[150px] animate-pulse opacity-50"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px] animate-breathe opacity-30"></div>
        </div>
        
        <div className="max-w-5xl w-full relative z-10 space-y-12 animate-fade-in-up">
          <div className="space-y-4 text-center relative group">
            <Link href="/operations" className="absolute -left-12 lg:-left-20 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-surface border border-theme-border hover:border-primary/50 transition-all shadow-sm">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
            </Link>
            <h2 className="text-5xl font-black text-theme-text tracking-tighter italic uppercase text-shadow-sm">Floor Control Room</h2>
            <p className="text-theme-text-muted font-black tracking-[0.3em] text-xs uppercase px-4 py-1.5 rounded-full bg-theme-surface-container inline-block border border-theme-border border-b-0">Initialize Hardware Target</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATIONS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => selectStation(s)}
                className="group relative flex flex-col items-center gap-5 p-8 rounded-[2.5rem] bg-surface border border-theme-border hover:border-primary/50 transition-all duration-500 shadow-xl hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] active:scale-95 overflow-hidden"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="w-16 h-16 rounded-[1.2rem] bg-theme-surface-container border border-theme-border text-theme-text-muted group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/30 flex items-center justify-center transition-all duration-500 shadow-inner group-hover:scale-110 group-hover:rotate-3 relative z-10">
                  <span className="material-symbols-outlined text-3xl">{s.icon}</span>
                </div>
                <div className="space-y-2 text-center relative z-10">
                  <span className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.2em]">{s.id}</span>
                  <p className="text-sm font-black text-theme-text group-hover:text-primary transition-colors">{s.name}</p>
                </div>
                <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. Main Dashboard UI (Premium Dark Mode)
  return (
    <div id="assembly-workflow-page" className="min-h-screen bg-background text-theme-text p-4 lg:p-8 font-sans selection:bg-primary/30 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

      <div className="max-w-8xl mx-auto space-y-8 relative z-10">
        
        {/* Header Control Panel */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-surface/80 border border-theme-border p-8 lg:p-10 rounded-[3rem] backdrop-blur-3xl shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          
          <div className="flex items-center gap-8 relative z-10">
            <div className={`w-20 h-20 rounded-[2rem] primary-gradient shadow-[0_0_40px_rgba(16,185,129,0.3)] text-white flex items-center justify-center group-hover:scale-105 transition-transform duration-500`}>
              <span className="material-symbols-outlined text-4xl">{station.icon}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Link href="/operations" className="flex items-center justify-center w-8 h-8 rounded-full bg-theme-surface-container hover:bg-theme-surface-container/80 transition-colors mr-1">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                </Link>
                <span className="text-xs font-black text-primary uppercase tracking-[0.3em] bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">{station.id}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <span className="text-xs font-black text-theme-text-muted uppercase tracking-widest">Live Flow Tracking</span>
              </div>
              <h1 className="text-4xl font-black text-theme-text tracking-tighter italic">{station.name}</h1>
              <button 
                onClick={() => setStation(null)}
                className="text-[10px] font-black text-theme-text-muted hover:text-primary uppercase tracking-[0.2em] transition-colors flex items-center gap-1.5 pt-1"
              >
                Reassign Station <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 relative z-10 w-full xl:w-auto">
            {/* Scan Area */}
            <form onSubmit={handleScan} className="flex-1 min-w-[320px] relative group/scan">
              <span className={`material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 transition-colors duration-300 ${scanStatus?.type === 'error' ? 'text-amber-500' : 'text-primary'}`}>
                {scanStatus?.type === 'loading' ? 'sync' : 'barcode_scanner'}
              </span>
              <input
                ref={scanInputRef}
                type="text"
                placeholder="Scan Tag or Code..."
                autoFocus
                className={`w-full pl-16 pr-6 py-5 bg-theme-surface-container border text-lg font-black text-theme-text placeholder:text-theme-text-muted focus:outline-none transition-all duration-500 rounded-full ${
                  scanStatus?.type === 'error' ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)] focus:border-amber-500' : 'border-theme-border focus:border-primary/50 focus:ring-4 focus:ring-primary/10 shadow-lg'
                }`}
                value={scanValue}
                onChange={e => setScanValue(e.target.value)}
              />
              {scanStatus && (
                <div className={`absolute -bottom-8 left-6 text-xs font-black uppercase tracking-[0.2em] transition-all bg-surface px-4 py-1.5 rounded-full border shadow-lg ${
                  scanStatus.type === 'error' ? 'text-amber-500 border-amber-500/20' : 'text-primary border-primary/20'
                }`}>
                  {scanStatus.type === 'loading' && <span className="inline-block animate-spin mr-2">●</span>}
                  {scanStatus.message}
                </div>
              )}
            </form>

             <div className="flex items-center gap-4">
                <div className="bg-surface p-5 rounded-[1.5rem] border border-theme-border text-center min-w-[100px] shadow-sm">
                  <p className="text-[9px] font-black text-theme-text-muted uppercase tracking-[0.2em] mb-1">Queue</p>
                  <p className="text-3xl font-black text-theme-text leading-none">{data.stats?.received_count || 0}</p>
                </div>
                <div className={`bg-surface p-5 rounded-[1.5rem] border text-center min-w-[100px] shadow-sm transition-colors ${data.active?.filter(i => i.is_bottleneck).length > 0 ? 'border-red-500/30 bg-red-950/10' : 'border-theme-border'}`}>
                  <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">Bottlenecks</p>
                  <p className={`text-3xl font-black leading-none ${data.active?.filter(i => i.is_bottleneck).length > 0 ? 'text-red-500 animate-pulse' : 'text-theme-text'}`}>
                    {data.active?.filter(i => i.is_bottleneck).length || 0}
                  </p>
                </div>
             </div>
           </div>
         </div>
 
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           
           {/* Main List Area (L: 8/12) */}
           <div className="lg:col-span-8 space-y-6">
             <div className="flex items-center justify-between px-4 pb-2 border-b border-theme-border/50">
               <h3 className="text-xs font-black text-theme-text-muted uppercase tracking-[0.3em] flex items-center gap-2">
                 <span className="material-symbols-outlined text-[16px]">list_alt</span> Active Pool
               </h3>
               <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                  <span className="material-symbols-outlined text-[14px] text-primary">sensors</span>
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Real-time Sync</span>
               </div>
             </div>
 
             <div className="grid gap-4">
               {data.active?.length === 0 ? (
                 <div className="py-32 text-center bg-surface border border-theme-border rounded-[3rem] shadow-xl">
                   <div className="w-24 h-24 rounded-[2rem] bg-theme-surface-container flex items-center justify-center mx-auto mb-6 shadow-inner border border-theme-border">
                     <span className="material-symbols-outlined text-5xl text-theme-text-muted">done_all</span>
                   </div>
                   <h4 className="text-3xl font-black text-theme-text italic">Floor Clear</h4>
                   <p className="text-theme-text-muted font-bold tracking-[0.2em] uppercase text-xs mt-3">All garments processed efficiently</p>
                 </div>
               ) : (
                 data.active?.map((item, idx) => {
                   const isCurrentOrder = checklist?.items?.some(ci => ci.id === item.id);
                   const isScanned = checklist?.scanned_tag === item.tag_id;
                   const isBottleneck = item.is_bottleneck;
 
                   return (
                     <div 
                       key={item.id}
                       className={`group relative p-6 lg:p-8 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-1 flex flex-col sm:flex-row items-center gap-6 overflow-hidden ${
                         isScanned 
                           ? 'bg-primary/20 border-primary shadow-[0_10px_40px_rgba(16,185,129,0.2)]'
                           : isBottleneck
                             ? 'bg-red-950/20 border-red-500/30'
                             : isCurrentOrder
                               ? 'bg-surface border-primary/30 shadow-lg'
                               : 'bg-surface border-theme-border hover:border-theme-text shadow-sm'
                       }`}
                       style={{ animationDelay: `${idx * 40}ms` }}
                     >
                       {/* Context Glow */}
                       <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 pointer-events-none rounded-full ${
                         isScanned ? 'bg-primary' : isBottleneck ? 'bg-red-500' : 'bg-primary/30'
                       }`}></div>
 
                       <div className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform ${
                         isScanned ? 'bg-primary border border-primary text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : isBottleneck ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-theme-surface-container text-theme-text border border-theme-border'
                       }`}>
                          <span className={`material-symbols-outlined text-3xl`}>
                            {STAGE_LABELS[item.status] === 'Washing' ? 'local_laundry_service' : 'category'}
                          </span>
                       </div>
 
                       <div className="flex-1 min-w-0 space-y-2 w-full">
                         <div className="flex flex-wrap items-center gap-3">
                           <p className={`text-xl font-black uppercase tracking-tight italic ${isScanned ? 'text-primary' : 'text-theme-text'}`}>{item.garment_type}</p>
                           <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border ${
                             isScanned ? 'bg-primary/20 border-primary/30 text-primary' : isBottleneck ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-theme-surface-container border-theme-border text-theme-text-muted'
                           }`}>
                             {STAGE_LABELS[item.status]}
                           </span>
                           {isBottleneck && (
                             <span className="flex items-center gap-1.5 text-[9px] font-black text-red-500 uppercase tracking-[0.2em] animate-pulse bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                               <span className="material-symbols-outlined text-xs">warning</span> Overdue
                             </span>
                           )}
                         </div>
                         <div className={`flex flex-wrap items-center gap-y-2 gap-x-4 text-[10px] font-black uppercase tracking-[0.2em] ${isScanned ? 'text-theme-text' : 'text-theme-text-muted'}`}>
                            <span>{item.service_type}</span>
                            <span className={`w-1 h-1 rounded-full ${isScanned ? 'bg-primary/50' : 'bg-theme-border'}`}></span>
                            <span className={isScanned ? 'text-white' : 'text-primary'}>{item.order_number}</span>
                            <span className={`w-1 h-1 rounded-full ${isScanned ? 'bg-primary/50' : 'bg-theme-border'}`}></span>
                            <span>Tag: {item.tag_id}</span>
                            <span className={`w-1 h-1 rounded-full ${isScanned ? 'bg-primary/50' : 'bg-theme-border'}`}></span>
                            <span className={isBottleneck ? 'text-red-500 font-bold' : ''}>Dwell: {item.dwell_time_minutes}m</span>
                         </div>
                       </div>
 
                       <div className="flex items-center gap-6 shrink-0 md:justify-end w-full sm:w-auto">
                          {item.customer_name && (
                            <div className="text-right hidden sm:block">
                              <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${isScanned ? 'text-primary' : 'text-theme-text-muted'}`}>Client Auth</p>
                              <p className={`text-xs font-black ${isScanned ? 'text-theme-text' : 'text-theme-text'}`}>{item.customer_name}</p>
                            </div>
                          )}
                          <div className={`w-14 h-14 rounded-full border bg-surface flex items-center justify-center shrink-0 ${
                            isScanned ? 'border-primary text-primary shadow-[0_0_20px_rgba(16,185,129,0.3)]' : isBottleneck ? 'border-red-500/40 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-theme-border text-theme-text-muted'
                          }`}>
                            <span className="material-symbols-outlined text-[20px]">{isScanned ? 'verified' : isBottleneck ? 'priority_high' : 'center_focus_weak'}</span>
                          </div>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
           </div>
 
           {/* Sidebar Area (R: 4/12) */}
           <div className="lg:col-span-4 space-y-8 sticky top-8">
             
             {/* Bottleneck Analysis Sidebar */}
             {data.active?.some(i => i.is_bottleneck) && (
               <div className="bg-surface border border-red-500/20 rounded-[3rem] p-8 space-y-6 shadow-[0_20px_60px_rgba(239,68,68,0.05)] animate-scale-in relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full pointer-events-none"></div>
                 <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> Critical Alert
                      </p>
                      <h4 className="text-2xl font-black text-theme-text tracking-tighter">Action Required</h4>
                    </div>
                    <div className="w-12 h-12 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-[1rem]">
                      <span className="material-symbols-outlined text-lg">warning</span>
                    </div>
                 </div>
 
                 <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar pr-2 relative z-10">
                    {data.active?.filter(i => i.is_bottleneck).map(i => (
                      <div key={i.id} className="p-5 rounded-[1.5rem] bg-theme-surface-container border border-theme-border flex items-center justify-between group/bot hover:border-red-500/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-[0.8rem] bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[16px]">timer_off</span>
                          </div>
                          <div>
                            <p className="text-sm font-black uppercase text-theme-text">{i.garment_type}</p>
                            <p className="text-[9px] font-black text-red-500/80 uppercase tracking-[0.2em]">{STAGE_LABELS[i.status]} wait: {i.dwell_time_minutes}m</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-text-muted px-2 py-1 bg-background rounded-md border border-theme-border">{i.order_number}</span>
                      </div>
                    ))}
                 </div>
 
                 <div className="pt-6 border-t border-theme-border relative z-10">
                    <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.2em] leading-relaxed">
                      High latency detected in <span className="text-theme-text">{new Set(data.active?.filter(i => i.is_bottleneck).map(i => STAGE_LABELS[i.status])).size}</span> operative stages. 
                      Resource reallocation is highly recommended.
                    </p>
                 </div>
               </div>
             )}
 
             {/* Checklist View */}
             {checklist ? (
               <div className="bg-surface border border-theme-border rounded-[3rem] p-8 space-y-6 shadow-xl animate-scale-in">
                 <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">track_changes</span> Batch Progress
                      </p>
                      <h4 className="text-2xl font-black text-theme-text tracking-tighter">{checklist.order_number}</h4>
                    </div>
                    <button onClick={() => setChecklist(null)} className="w-10 h-10 flex items-center justify-center bg-theme-surface-container border border-theme-border hover:bg-theme-border text-theme-text-muted rounded-xl transition-colors active:scale-95">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                 </div>
 
                 <div className="space-y-3">
                    {checklist.items?.map(i => {
                      const isScannedNow = i.tag_id === checklist.scanned_tag;
                      const isReady = i.status === 'ready';
                      return (
                        <div key={i.id} className={`p-5 rounded-[1.5rem] flex items-center justify-between transition-all ${
                          isScannedNow ? 'bg-primary/10 border border-primary/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-theme-surface-container border border-theme-border'
                        }`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                              isScannedNow ? 'bg-primary border-primary text-white shadow-lg' : isReady ? 'bg-theme-border/50 border-theme-border text-primary'  : 'bg-background border-theme-border text-theme-text-muted'
                            }`}>
                              <span className="material-symbols-outlined text-[16px]">
                                {isReady ? 'verified' : isScannedNow ? 'done' : 'adjust'}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-black uppercase tracking-tight italic ${isScannedNow ? 'text-primary' : 'text-theme-text'}`}>{i.garment_type}</p>
                              <p className="text-[9px] font-black text-theme-text-muted uppercase tracking-[0.2em] mt-0.5">{STAGE_LABELS[i.status]}</p>
                            </div>
                          </div>
                          {!isScannedNow && !isReady && (
                            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-black tracking-[0.2em] uppercase border border-amber-500/20">Pending</span>
                          )}
                          {isScannedNow && (
                             <div className="flex gap-1">
                               {[1,2,3].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce shadow-[0_0_10px_rgba(16,185,129,0.8)]" style={{ animationDelay: `${d * 0.1}s` }}></span>)}
                             </div>
                          )}
                        </div>
                      );
                    })}
                 </div>
 
                 <div className="pt-6 border-t border-theme-border/50 flex justify-between items-center">
                    <div className="flex flex-col">
                       <p className="text-[9px] font-black text-theme-text-muted uppercase tracking-[0.3em] mb-1">Order Integrity</p>
                       <p className={`text-xs font-black uppercase tracking-widest ${checklist.items.every(i => i.status === checklist.items[0].status) ? 'text-primary' : 'text-amber-500'}`}>
                         {checklist.items.every(i => i.status === checklist.items[0].status) ? 'Batch Synchronized' : 'Desync Detected'}
                       </p>
                    </div>
                 </div>
               </div>
             ) : (
               <div className="bg-surface/50 border border-theme-border rounded-[3rem] p-12 text-center space-y-6 shadow-sm backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-theme-surface-container opacity-50"></div>
                  <div className="w-20 h-20 rounded-[1.5rem] bg-theme-surface-container flex items-center justify-center mx-auto mb-4 border border-theme-border relative z-10 group-hover:scale-105 transition-transform">
                     <span className="material-symbols-outlined text-theme-text-muted text-4xl">data_exploration</span>
                  </div>
                  <p className="text-[11px] font-black text-theme-text-muted uppercase tracking-[0.3em] leading-loose relative z-10">
                    Scan any garment tag to <br/><span className="text-theme-text">initialize real-time</span><br/> batch diagnostics.
                  </p>
               </div>
             )}
 
             {/* Quick Stats Dashboard */}
             <div className="p-8 rounded-[3rem] bg-theme-surface-container border border-theme-border shadow-xl space-y-8 relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                   <h4 className="text-[11px] font-black text-theme-text uppercase tracking-[0.3em] flex items-center gap-2">
                     <span className="material-symbols-outlined text-sm">schedule</span> Session Data
                   </h4>
                   <span className="text-[9px] font-black text-theme-text-muted uppercase bg-surface px-2 py-1 rounded border border-theme-border">Audit: {Math.floor(Math.random()*90000 + 10000)}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-6 relative z-10">
                   <div className="space-y-2">
                      <p className="text-4xl font-black text-theme-text tracking-tighter">{data.stats?.received_count || 0}</p>
                      <p className="text-[9px] font-black text-theme-text-muted uppercase tracking-[0.2em]">Processed Today</p>
                   </div>
                   <div className="space-y-2">
                      <p className="text-4xl font-black text-primary tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">100%</p>
                      <p className="text-[9px] font-black text-theme-text-muted uppercase tracking-[0.2em]">Target Rate</p>
                   </div>
                </div>
 
                <div className="space-y-3 relative z-10 pt-2 border-t border-theme-border/50">
                   <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.3em]">
                      <span className="text-theme-text-muted">Efficiency Radar</span>
                      <span className="text-primary animate-pulse">Nominal</span>
                   </div>
                   <div className="h-2 bg-surface rounded-full overflow-hidden p-0.5 border border-theme-border shadow-inner">
                      <div className="h-full bg-primary rounded-full w-[80%] animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                   </div>
                </div>
             </div>

           </div>
         </div>
       </div>

      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.05); }
        }
        .animate-float-slow {
          animation: float-slow 15s ease-in-out infinite;
        }
        .animate-scale-in {
          animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
