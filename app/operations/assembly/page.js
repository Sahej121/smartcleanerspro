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

const STAGE_ORDER = ['received', 'sorting', 'washing', 'dry_cleaning', 'drying', 'ironing', 'quality_check', 'ready', 'delivered'];

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
  const [scanStatus, setScanStatus] = useState(null); // { type: 'success' | 'error', message: string, item?: any }
  const [checklist, setChecklist] = useState(null); // Current order checklist after scan
  
  const scanInputRef = useRef(null);

  useEffect(() => {
    // Load station from local storage
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
        // Play success sound
        new Audio('/sounds/success.mp3').play().catch(e => console.error('Audio play failed', e));

        setScanStatus({ 
          type: 'success', 
          message: `Advanced ${result.item.garment_type} to ${STAGE_LABELS[result.nextStatus]}`,
          item: result.item
        });
        
        // Fetch order items for checklist
        const orderRes = await fetch(`/api/orders/${result.order_id}`);
        const orderData = await orderRes.json();
        setChecklist({
          order_number: result.order_number,
          items: orderData.items,
          scanned_tag: tagId
        });

        // Refresh main data
        fetchData();

        // Clear status after 5s
        setTimeout(() => setScanStatus(null), 5000);
      } else {
        // Play error sound
        new Audio('/sounds/error.mp3').play().catch(e => console.error('Audio play failed', e));

        setScanStatus({ type: 'error', message: result.error });
      }
    } catch (err) {
      // Play error sound
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-8">
      <div className="w-16 h-16 rounded-full border-4 border-emerald-900 border-t-emerald-400 animate-spin mb-6"></div>
      <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Initializing Control Room</p>
    </div>
  );

  const isPro = user?.tier === 'pro' || user?.role === 'owner';
  if (!isPro) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        {/* Blurred Teaser Background */}
        <div className="absolute inset-0 z-0 opacity-20 blur-[15px] grayscale pointer-events-none select-none">
          <div className="p-12 space-y-12 max-w-7xl mx-auto">
            <div className="h-48 bg-slate-800 rounded-[48px]"></div>
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-8 space-y-4">
                <div className="h-32 bg-slate-800 rounded-3xl"></div>
                <div className="h-32 bg-slate-800 rounded-3xl"></div>
                <div className="h-32 bg-slate-800 rounded-3xl"></div>
              </div>
              <div className="col-span-4 h-96 bg-slate-800 rounded-[48px]"></div>
            </div>
          </div>
        </div>

        {/* Emerald Glow Effects */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] animate-breathe"></div>

        <div className="max-w-3xl w-full relative z-10 text-center space-y-10 animate-fade-in-up">
           <div className="space-y-4">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
                <span className="material-symbols-outlined text-sm">workspace_premium</span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Professional Tier Required</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter italic leading-[0.9]">
                THE POWER OF <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">PREMIUM ASSEMBLY</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed font-bold italic">
                Unlock the industrial-grade Control Room designed for facilities processing 1,000+ garments daily.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {[
                { title: 'Scan-To-Advance', desc: 'Hardware barcode support for 0.1s stage updates.', icon: 'barcode_scanner' },
                { title: 'Audit Trail', desc: 'Precise worker accountability logs for every scan.', icon: 'history_edu' },
                { title: 'Bottleneck AI', desc: 'Auto-detect late garments stuck in production.', icon: 'analytics' }
              ].map((f, i) => (
                <div key={i} className="p-6 rounded-[32px] bg-white/5 border border-white/5 backdrop-blur-xl group hover:bg-white/10 transition-all duration-500">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-emerald-900/40 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-xl">{f.icon}</span>
                  </div>
                  <h4 className="text-white font-black text-xs uppercase tracking-widest mb-1 italic">{f.title}</h4>
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{f.desc}</p>
                </div>
              ))}
           </div>

           <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <Link 
                href="/admin/billing" 
                className="w-full sm:w-auto px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-2xl shadow-emerald-900/40 active:scale-95 flex items-center justify-center gap-3 group"
              >
                UPGRADE TO PRO
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">rocket_launch</span>
              </Link>
              <Link 
                href="/operations"
                className="text-[11px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
              >
                Return to Dashboard
              </Link>
           </div>

           <div className="pt-8 flex items-center justify-center gap-12 opacity-30 grayscale">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Trusted by 500+ Facilities Globaly</span>
           </div>
        </div>
      </div>
    );
  }

  // 2. Station Selector (If not selected)
  if (!station) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 lg:p-12 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[120px] animate-float-slow"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[100px] animate-breathe"></div>
        </div>
        
        <div className="max-w-4xl w-full relative z-10 space-y-12 text-center animate-fade-in-up">
          <div className="space-y-4">
            <h2 className="text-5xl font-black text-white tracking-tighter italic uppercase">Floor Control Room</h2>
            <p className="text-slate-500 font-bold tracking-[0.2em] text-xs uppercase">Select your current production station to begin</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATIONS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => selectStation(s)}
                className="group relative flex flex-col items-center gap-5 p-8 rounded-[40px] bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all duration-500 shadow-2xl hover:shadow-emerald-500/10 active:scale-95"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="w-16 h-16 rounded-[24px] bg-slate-800 text-slate-500 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-all duration-500 shadow-inner group-hover:scale-110">
                  <span className="material-symbols-outlined text-3xl">{s.icon}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.id}</span>
                  <p className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{s.name}</p>
                </div>
                <div className="absolute inset-0 border-2 border-emerald-500/0 group-hover:border-emerald-500/20 rounded-[40px] pointer-events-none transition-all duration-500"></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. Main Dashboard UI (Premium Dark Mode)
  return (
    <div id="assembly-workflow-page" className="min-h-screen bg-slate-950 text-slate-300 p-4 lg:p-8 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="max-w-8xl mx-auto space-y-8">
        
        {/* Header Control Panel */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-slate-900/50 border border-slate-800 p-6 lg:p-10 rounded-[48px] backdrop-blur-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="flex items-center gap-8 relative z-10">
            <div className={`p-6 rounded-3xl bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)] text-white group-hover:scale-105 transition-transform duration-500`}>
              <span className="material-symbols-outlined text-4xl">{station.icon}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em] bg-emerald-500/10 px-3 py-1 rounded-full">{station.id}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Live Flow Tracking</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">{station.name}</h1>
              <button 
                onClick={() => setStation(null)}
                className="text-[10px] font-black text-slate-500 hover:text-emerald-400 uppercase tracking-widest transition-colors flex items-center gap-1.5"
              >
                Change Station <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 relative z-10 w-full xl:w-auto">
            {/* Scan Area */}
            <form onSubmit={handleScan} className="flex-1 min-w-[320px] relative group/scan">
              <span className={`material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 transition-colors duration-300 ${scanStatus?.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
                {scanStatus?.type === 'loading' ? 'sync' : 'barcode_scanner'}
              </span>
              <input
                ref={scanInputRef}
                type="text"
                placeholder="Scan Tag or Type ID..."
                autoFocus
                className={`w-full pl-16 pr-6 py-5 bg-slate-950 border-2 rounded-[28px] text-lg font-bold text-white placeholder:text-slate-700 focus:outline-none transition-all duration-500 ${
                  scanStatus?.type === 'error' ? 'border-red-500/30 ring-4 ring-red-500/10' : 'border-emerald-500/20 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-2xl'
                }`}
                value={scanValue}
                onChange={e => setScanValue(e.target.value)}
              />
              {scanStatus && (
                <div className={`absolute -bottom-10 left-6 text-xs font-black uppercase tracking-widest transition-all ${
                  scanStatus.type === 'error' ? 'text-red-500' : 'text-emerald-500'
                }`}>
                  {scanStatus.type === 'loading' && <span className="inline-block animate-spin mr-2">●</span>}
                  {scanStatus.message}
                </div>
              )}
            </form>

             <div className="flex items-center gap-3">
                <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 text-center min-w-[100px]">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Queue</p>
                  <p className="text-2xl font-black text-white leading-none">{data.stats?.received_count || 0}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 text-center min-w-[100px]">
                  <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Bottlenecks</p>
                  <p className={`text-2xl font-black leading-none ${data.active?.filter(i => i.is_bottleneck).length > 0 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                    {data.active?.filter(i => i.is_bottleneck).length || 0}
                  </p>
                </div>
             </div>
           </div>
         </div>
 
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           
           {/* Main List Area (L: 8/12) */}
           <div className="lg:col-span-8 space-y-6">
             <div className="flex items-center justify-between px-4">
               <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">Active Production Pool</h3>
               <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-500">sensors</span>
                  <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest">Real-time Syncing</span>
               </div>
             </div>
 
             <div className="grid gap-4">
               {data.active?.length === 0 ? (
                 <div className="py-24 text-center bg-slate-900/20 rounded-[48px] border-2 border-dashed border-slate-800">
                   <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
                     <span className="material-symbols-outlined text-4xl text-slate-600">inventory_2</span>
                   </div>
                   <h4 className="text-2xl font-black text-white italic">Floor is empty</h4>
                   <p className="text-slate-600 font-bold text-sm">Everything is processed for now.</p>
                 </div>
               ) : (
                 data.active.map((item, idx) => {
                   const isCurrentOrder = checklist?.items?.some(ci => ci.id === item.id);
                   const isScanned = checklist?.scanned_tag === item.tag_id;
                   const isBottleneck = item.is_bottleneck;
 
                   return (
                     <div 
                       key={item.id}
                       className={`group relative p-6 rounded-[32px] border-2 transition-all duration-500 hover:scale-[1.01] flex items-center gap-6 overflow-hidden ${
                         isScanned 
                           ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_60px_rgba(16,185,129,0.2)]'
                           : isBottleneck
                             ? 'bg-red-950/20 border-red-500/30'
                             : isCurrentOrder
                               ? 'bg-emerald-950/40 border-emerald-500/30 shadow-lg'
                               : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-sm'
                       }`}
                       style={{ animationDelay: `${idx * 50}ms` }}
                     >
                       {/* Glow Overlay */}
                       <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] opacity-20 pointer-events-none rounded-full ${
                         isScanned ? 'bg-white' : isBottleneck ? 'bg-red-500' : 'bg-emerald-500/30'
                       }`}></div>
 
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform ${
                         isScanned ? 'bg-white/20' : isBottleneck ? 'bg-red-500/20' : 'bg-slate-950'
                       }`}>
                          <span className={`material-symbols-outlined text-2xl ${isScanned ? 'text-white' : isBottleneck ? 'text-red-500' : 'text-emerald-500'}`}>
                            {STAGE_LABELS[item.status] === 'Washing' ? 'local_laundry_service' : 'category'}
                          </span>
                       </div>
 
                       <div className="flex-1 min-w-0 space-y-1">
                         <div className="flex items-center gap-3">
                           <p className={`text-lg font-black uppercase tracking-tight italic ${isScanned ? 'text-white' : 'text-slate-100'}`}>{item.garment_type}</p>
                           <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full ${
                             isScanned ? 'bg-white/20 text-white' : isBottleneck ? 'bg-red-500/20 text-red-400' : 'bg-slate-950 text-slate-500'
                           }`}>
                             {STAGE_LABELS[item.status]}
                           </span>
                           {isBottleneck && (
                             <span className="flex items-center gap-1 text-[10px] font-black text-red-500 uppercase animate-pulse">
                               <span className="material-symbols-outlined text-xs">warning</span> Overdue
                             </span>
                           )}
                         </div>
                         <div className={`flex items-center gap-4 text-[10px] font-black uppercase tracking-widest ${isScanned ? 'text-white/60' : 'text-slate-500'}`}>
                            <span>{item.service_type}</span>
                            <span className={`w-1 h-1 rounded-full ${isScanned ? 'bg-white/30' : 'bg-slate-800'}`}></span>
                            <span className="text-emerald-500 italic">{item.order_number}</span>
                            <span className={`w-1 h-1 rounded-full ${isScanned ? 'bg-white/30' : 'bg-slate-800'}`}></span>
                            <span>Tag: {item.tag_id}</span>
                            <span className={`w-1 h-1 rounded-full ${isScanned ? 'bg-white/30' : 'bg-slate-800'}`}></span>
                            <span className={isBottleneck ? 'text-red-500 font-bold' : ''}>Dwell: {item.dwell_time_minutes}m</span>
                         </div>
                       </div>
 
                       <div className="flex items-center gap-6 shrink-0">
                          {item.customer_name && (
                            <div className="text-right hidden md:block">
                              <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isScanned ? 'text-white/60' : 'text-slate-600'}`}>Client</p>
                              <p className={`text-[11px] font-bold ${isScanned ? 'text-white' : 'text-slate-300'}`}>{item.customer_name}</p>
                            </div>
                          )}
                          <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center ${
                            isScanned ? 'border-white/30 text-white' : isBottleneck ? 'border-red-500/30 text-red-500' : 'border-slate-800 text-slate-500'
                          }`}>
                            <span className="material-symbols-outlined text-[18px]">{isScanned ? 'done_all' : isBottleneck ? 'priority_high' : 'checklist'}</span>
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
               <div className="bg-red-950/10 border border-red-500/20 rounded-[48px] p-8 space-y-6 shadow-2xl animate-scale-in">
                 <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-1">System Bottlenecks</p>
                      <h4 className="text-2xl font-black text-white">Action Required</h4>
                    </div>
                    <div className="p-2 bg-red-500 text-white rounded-xl">
                      <span className="material-symbols-outlined text-sm">priority_high</span>
                    </div>
                 </div>
 
                 <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                    {data.active.filter(i => i.is_bottleneck).map(i => (
                      <div key={i.id} className="p-4 rounded-2xl bg-red-950/20 border border-red-500/10 flex items-center justify-between group/bot">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center shrink-0 shadow-lg">
                            <span className="material-symbols-outlined text-[14px]">timer_off</span>
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase text-white">{i.garment_type}</p>
                            <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest">{STAGE_LABELS[i.status]} wait: {i.dwell_time_minutes}m</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-slate-500">{i.order_number}</span>
                      </div>
                    ))}
                 </div>
 
                 <div className="pt-4 border-t border-red-500/10">
                    <p className="text-[9px] font-black text-red-500/60 uppercase tracking-widest leading-relaxed">
                      High latency detected in {new Set(data.active.filter(i => i.is_bottleneck).map(i => STAGE_LABELS[i.status])).size} stages. 
                      Resource reallocation recommended.
                    </p>
                 </div>
               </div>
             )}
 
             {/* Checklist View */}
             {checklist ? (
               <div className="bg-slate-900 border border-slate-800 rounded-[48px] p-8 space-y-6 shadow-2xl animate-scale-in">
                 <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">Batch Progress</p>
                      <h4 className="text-2xl font-black text-white">{checklist.order_number}</h4>
                    </div>
                    <button onClick={() => setChecklist(null)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                      <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                 </div>
 
                 <div className="space-y-3">
                    {checklist.items.map(i => {
                      const isScannedNow = i.tag_id === checklist.scanned_tag;
                      const isReady = i.status === 'ready';
                      return (
                        <div key={i.id} className={`p-4 rounded-2xl flex items-center justify-between group/check ${
                          isScannedNow ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-950 border border-slate-900'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isScannedNow ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-900 text-slate-600'
                            }`}>
                              <span className="material-symbols-outlined text-[14px]">
                                {isReady ? 'verified' : isScannedNow ? 'done' : 'circle'}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-black uppercase tracking-tight italic ${isScannedNow ? 'text-emerald-400' : 'text-slate-300'}`}>{i.garment_type}</p>
                              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{STAGE_LABELS[i.status]}</p>
                            </div>
                          </div>
                          {!isScannedNow && !isReady && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-black tracking-widest border border-amber-500/10 animate-pulse">PENDING</span>
                          )}
                          {isScannedNow && (
                             <div className="flex gap-1">
                               {[1,2,3].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${d * 0.1}s` }}></span>)}
                             </div>
                          )}
                        </div>
                      );
                    })}
                 </div>
 
                 <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Order Integrity: <span className={checklist.items.every(i => i.status === checklist.items[0].status) ? 'text-emerald-500' : 'text-amber-500'}>
                        {checklist.items.every(i => i.status === checklist.items[0].status) ? 'SYMBOLS MATCHED' : 'BATCH LOGIC DISTURBED'}
                      </span>
                    </p>
                 </div>
               </div>
             ) : (
               <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[48px] p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center mx-auto mb-4 border border-slate-800">
                     <span className="material-symbols-outlined text-slate-700 text-3xl">data_exploration</span>
                  </div>
                  <p className="text-xs font-black text-slate-700 uppercase tracking-widest leading-loose">
                    Scan a garment to <br/> see real-time batch analysis <br/> and order completeness.
                  </p>
               </div>
             )}
 
             {/* Quick Stats Dashboard */}
             <div className="space-y-4">
               <div className="p-8 rounded-[48px] bg-gradient-to-br from-slate-900 to-black border border-slate-800 space-y-6">
                  <div className="flex justify-between items-center">
                     <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] italic">Current Session</h4>
                     <span className="text-[10px] font-black text-slate-500 uppercase">Audit ID: {Math.floor(Math.random()*90000 + 10000)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <p className="text-3xl font-black text-white tracking-tighter">0</p>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Processed Today</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-3xl font-black text-emerald-500 tracking-tighter">100%</p>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">QC Pass Rate</p>
                     </div>
                  </div>
 
                  <div className="space-y-3">
                     <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        <span>Efficiency Radar</span>
                        <span className="text-emerald-500">Nominal</span>
                     </div>
                     <div className="h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div className="h-full bg-emerald-500 rounded-full w-[80%] animate-pulse"></div>
                     </div>
                  </div>
               </div>
             </div>
           </div>
         </div>
       </div>

      {/* Global CSS for Animations */}
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
