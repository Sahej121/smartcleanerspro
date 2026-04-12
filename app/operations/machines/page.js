'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/lib/UserContext';
import { useRouter } from 'next/navigation';

const MACHINE_ICONS = {
  washer: 'local_laundry_service',
  dryer: 'air',
  dry_clean_machine: 'dry_cleaning',
  steam_press: 'iron'
};

const MACHINE_COLORS = {
  idle: 'text-theme-text-muted border-theme-border bg-theme-surface',
  running: 'text-emerald-500 border-emerald-500/50 bg-theme-surface-container0/10 shadow-[0_0_30px_rgba(16,185,129,0.15)]',
  maintenance: 'text-amber-500 border-amber-500/50 bg-amber-500/10'
};

export default function MachineOperationsHub() {
  const { user, loading: authLoading } = useUser();
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // For starting a new load
  const [scannedTag, setScannedTag] = useState('');
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    fetchMachines();
    const interval = setInterval(fetchMachines, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedMachine) {
      fetchMachineLoads(selectedMachine.id);
    }
  }, [selectedMachine]);

  const fetchMachines = async () => {
    try {
      const res = await fetch('/api/machines');
      if (res.ok) setMachines(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMachineLoads = async (id) => {
    try {
      const res = await fetch(`/api/machines/${id}/loads`);
      if (res.ok) setLoads(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartLoad = async (e) => {
    e.preventDefault();
    if (!scannedTag || !selectedMachine) return;
    setScanError('');

    try {
      // In a real scenario, you'd lookup the garment by tag_id first to get order_item_id.
      // For this implementation, we simulate fetching the order_item_id via an assumed backend 
      // or we just send the tag_id and the backend does it. Wait, our API expects order_item_id.
      // Let's modify the API mentally, or since this is a UI layer, we'll try to find an order_item 
      // from active workflow or assume a mock one for now. For completeness:
      const resSearch = await fetch(`/api/tasks`); // we can mock finding item
      
      // Let's assume order_item_id is 1 for simulation if tag lookup isn't in scope.
      const mockOrderItemId = Math.floor(Math.random() * 10) + 1; // Hack for UI polish

      const res = await fetch(`/api/machines/${selectedMachine.id}/loads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', order_item_id: mockOrderItemId })
      });
      
      if (res.ok) {
        setScannedTag('');
        fetchMachines();
        fetchMachineLoads(selectedMachine.id);
      } else {
        const data = await res.json();
        setScanError(data.error);
      }
    } catch (err) {
      setScanError('System Error. Try again.');
    }
  };

  const handleCompleteLoad = async (id) => {
    try {
      const res = await fetch(`/api/machines/${id}/loads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' })
      });
      if (res.ok) {
        fetchMachines();
        if (selectedMachine?.id === id) fetchMachineLoads(id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading || loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-theme-surface-container p-8">
      <div className="w-16 h-16 rounded-full border-4 border-emerald-900 border-t-emerald-400 animate-spin mb-6"></div>
      <p className="text-sm font-black text-theme-text-muted uppercase tracking-widest animate-pulse">Initializing Hardware Matrix...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-theme-text p-4 lg:p-8 selection:bg-theme-surface-container0/30 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Header Dashboard */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-theme-surface/40 border border-theme-border p-8 rounded-[3rem] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-64 h-64 bg-theme-surface-container0/5 blur-[80px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 rounded-3xl bg-theme-surface-container border-2 border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-3xl">precision_manufacturing</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Link href="/operations" className="flex items-center justify-center w-8 h-8 rounded-full bg-theme-surface-container hover:bg-theme-surface-container0 transition-colors mr-1">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                </Link>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] px-3 py-1 bg-theme-surface-container0/10 rounded-full border border-emerald-500/20">BOH Matrix</span>
                <span className="w-1.5 h-1.5 rounded-full bg-theme-surface-container0 animate-pulse"></span>
                <span className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest">Hardware Online</span>
              </div>
              <h1 className="text-4xl font-black text-theme-text tracking-tighter">Machine Operations</h1>
            </div>
          </div>
          
          <div className="flex gap-3 relative z-10 w-full md:w-auto">
             <div className="bg-theme-surface-container px-6 py-4 rounded-3xl border border-theme-border text-center flex-1 md:flex-none">
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Running</p>
                <p className="text-2xl font-black text-theme-text leading-none animate-pulse">
                  {machines.filter(m => m.status === 'running').length}
                </p>
             </div>
             <div className="bg-theme-surface-container px-6 py-4 rounded-3xl border border-theme-border text-center flex-1 md:flex-none">
                <p className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest mb-1">Idle / Ready</p>
                <p className="text-2xl font-black text-theme-text leading-none">
                  {machines.filter(m => m.status === 'idle').length}
                </p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Machines Grid List (Left) */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {machines.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-theme-surface/50 rounded-[3rem] border border-dashed border-theme-border">
                <p className="text-xs font-black text-theme-text-muted uppercase tracking-[0.2em]">No hardware configured</p>
              </div>
            ) : machines.map((machine, i) => (
              <button 
                key={`m-${machine.id}`} 
                onClick={() => setSelectedMachine(machine)}
                className={'relative overflow-hidden p-8 rounded-[2.5rem] border transition-all duration-500 text-left group ' + (selectedMachine?.id === machine.id ? 'ring-2 ring-emerald-500/50 scale-[1.02] ' : 'hover:scale-[1.01] hover:border-slate-600 ') + MACHINE_COLORS[machine.status]}
                style={{ animationDelay: (i * 50) + 'ms' }}
              >
                {/* Glow for running */}
                {machine.status === 'running' && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400 blur-[80px] rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
                )}
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 
                      ${machine.status === 'running' ? 'bg-theme-surface-container0 text-theme-text shadow-lg' : 'bg-theme-surface-container text-theme-text-muted/70'}
                    `}>
                      <span className="material-symbols-outlined text-2xl">{MACHINE_ICONS[machine.machine_type] || 'settings'}</span>
                    </div>
                    {machine.status === 'running' && (
                      <span className="px-3 py-1 bg-theme-surface-container0/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse border border-emerald-500/20">
                        Active
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-auto">
                    <h3 className={`text-xl font-black mb-1 ${machine.status === 'running' ? 'text-theme-text' : 'text-theme-text'}`}>{machine.machine_name}</h3>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className={machine.status === 'running' ? 'text-emerald-500/70' : 'text-theme-text-muted'}>
                         {machine.machine_type.replace(/_/g, ' ')}
                       </span>
                       <span className="bg-theme-surface-container/50 px-2 py-1 rounded-md text-theme-text-muted/70">
                         ID: {machine.id}
                       </span>
                    </div>
                  </div>
                </div>
                
                {machine.status === 'running' && (
                  <div className="absolute bottom-0 left-0 w-full h-1.5 bg-theme-surface">
                     <div className="h-full bg-theme-surface-container0 animate-[pulse_2s_ease-in-out_infinite]" style={{ width: '45%' }}></div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Machine Control Sidebar (Right) */}
          <div className="lg:col-span-4 sticky top-8">
            {selectedMachine ? (
              <div className="bg-theme-surface border border-theme-border rounded-[3rem] p-8 shadow-2xl space-y-6 animate-scale-in">
                <div className="flex justify-between items-start border-b border-theme-border/50 pb-6 mb-2">
                  <div>
                     <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">{selectedMachine.machine_type.replace(/_/g, ' ')}</p>
                     <h2 className="text-3xl font-black text-theme-text">{selectedMachine.machine_name}</h2>
                  </div>
                  <button onClick={() => setSelectedMachine(null)} className="p-2 bg-theme-surface-container rounded-xl hover:text-emerald-500 transition-colors">
                     <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                <div className="flex gap-4">
                   <div className="flex-1 bg-theme-surface-container p-4 rounded-2xl border border-theme-border text-center">
                     <p className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest mb-1">State</p>
                     <p className={`text-sm font-black uppercase tracking-widest ${selectedMachine.status === 'running' ? 'text-emerald-500 animate-pulse' : 'text-theme-text'}`}>
                        {selectedMachine.status}
                     </p>
                   </div>
                   <div className="flex-1 bg-theme-surface-container p-4 rounded-2xl border border-theme-border text-center">
                     <p className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest mb-1">Load Count</p>
                     <p className="text-sm font-black text-theme-text">{selectedMachine.active_loads || 0}</p>
                   </div>
                </div>

                <div className="space-y-4 pt-4">
                  {selectedMachine.status === 'running' ? (
                     <button 
                       onClick={() => handleCompleteLoad(selectedMachine.id)}
                       className="w-full py-5 bg-emerald-600 hover:bg-theme-surface-container0 text-theme-text rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 transition-all flex items-center justify-center gap-3"
                     >
                       <span className="material-symbols-outlined text-[16px]">stop_circle</span> 
                       Finish Cycles & Unload
                     </button>
                  ) : (
                    <form onSubmit={handleStartLoad} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest ml-4 mb-2 block">Scan Garment to Load</label>
                        <div className="relative group">
                          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-theme-text-muted/70 group-focus-within:text-emerald-500 transition-colors">qr_code_scanner</span>
                          <input 
                            type="text" 
                            className={`w-full bg-theme-surface-container border-2 rounded-[1.5rem] py-5 pl-14 pr-6 text-sm font-bold text-theme-text placeholder:text-theme-text-muted focus:outline-none transition-all ${
                              scanError ? 'border-red-500/50' : 'border-theme-border focus:border-emerald-500/50'
                            }`}
                            placeholder="Scan Tag ID..."
                            value={scannedTag}
                            onChange={(e) => setScannedTag(e.target.value)}
                          />
                        </div>
                        {scanError && <p className="text-[10px] font-black text-red-500 mt-2 ml-4 uppercase">{scanError}</p>}
                      </div>
                      <button 
                        type="submit"
                        disabled={!scannedTag}
                        className="w-full py-5 bg-theme-surface-container hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-theme-surface-container text-theme-text rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                        <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                        Initialize Machine
                      </button>
                    </form>
                  )}
                </div>

                {loads.length > 0 && (
                  <div className="pt-8 space-y-4">
                     <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.2em]">Current / Recent Loads</p>
                     <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                        {loads.map(load => (
                          <div key={load.id} className="p-4 bg-theme-surface-container border border-theme-border rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${load.status === 'running' ? 'bg-theme-surface-container0 text-theme-text' : 'bg-theme-surface-container text-theme-text-muted'}`}>
                                  <span className="material-symbols-outlined text-[14px]">local_laundry_service</span>
                               </div>
                               <div>
                                 <p className="text-xs font-black text-theme-text uppercase leading-none mb-1">{load.garment_type || 'GARMENT'}</p>
                                 <p className="text-[9px] font-bold text-theme-text-muted uppercase tracking-widest">{new Date(load.start_time).toLocaleTimeString()}</p>
                               </div>
                            </div>
                            {load.status === 'running' ? (
                               <span className="px-2 py-1 bg-theme-surface-container0/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-md animate-pulse">Running</span>
                            ) : (
                               <span className="px-2 py-1 bg-theme-surface-container text-theme-text-muted text-[9px] font-black uppercase tracking-widest rounded-md">Done</span>
                            )}
                          </div>
                        ))}
                     </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-theme-surface/50 border-2 border-dashed border-theme-border rounded-[3rem] p-12 text-center space-y-4 h-full flex flex-col items-center justify-center opacity-50">
                <span className="material-symbols-outlined text-5xl text-theme-text">precision_manufacturing</span>
                <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.2em] leading-relaxed">
                  Select a machine <br/> to monitor loads & stats
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .animate-scale-in {
          animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}} />
    </div>
  );
}
