'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useUser, ROLES } from '@/lib/UserContext';

const STAGE_LABELS = {
  received: 'Received', sorting: 'Sorting', washing: 'Washing',
  dry_cleaning: 'Dry Cleaning', drying: 'Drying', ironing: 'Ironing',
  quality_check: 'Quality Check', ready: 'Ready', delivered: 'Delivered',
};

const STAGE_COLORS = {
  received: 'emerald', sorting: 'amber', washing: 'blue',
  dry_cleaning: 'purple', drying: 'sky', ironing: 'indigo',
  quality_check: 'rose', ready: 'primary', delivered: 'slate',
};

export default function ScannerPage() {
  const { role, user } = useUser();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [updatingItem, setUpdatingItem] = useState(null);
  const [flash, setFlash] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/orders?search=${encodeURIComponent(query)}`);
      const orders = await res.json();
      
      if (orders && orders.length > 0) {
        const detailRes = await fetch(`/api/orders/${orders[0].id}`);
        const detail = await detailRes.json();
        setResults(detail);
        setQuery(''); // Clear after scan
        triggerFlash();
      } else {
        setResults(null);
        setMessage('No orders found for this search.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error searching. Please try again.');
    }
    setLoading(false);
  };

  const triggerFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
  };

  const advanceItem = async (itemId) => {
    setUpdatingItem(itemId);
    try {
      const res = await fetch(`/api/workflow/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance' }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ Item moved to: ${STAGE_LABELS[data.newStage]}`);
        triggerFlash();
        // Refresh local items
        setResults(prev => ({
          ...prev,
          items: prev.items.map(it => it.id === itemId ? { ...it, status: data.newStage } : it)
        }));
      }
    } catch (err) {
      console.error(err);
      setMessage('⚠️ Failed to update stage.');
    }
    setUpdatingItem(null);
  };

  const canAdvance = [ROLES.STAFF, ROLES.OWNER, ROLES.ADMIN, ROLES.SUPERADMIN].includes(role);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${flash ? 'bg-emerald-500/10' : 'bg-transparent'}`}>
      <div id="scanner-page" className="max-w-6xl mx-auto space-y-8 animate-fade-in-up p-4 lg:p-8 text-theme-text">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-surface border border-theme-border p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          
          <div className="flex items-center gap-6 relative z-10">
            <Link href="/operations" className="flex items-center justify-center w-12 h-12 rounded-full bg-background border border-theme-border hover:border-emerald-500/50 transition-all shadow-sm">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">Back Office Operations</span>
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-theme-text font-headline mb-1">
                Garment Tracker
              </h1>
              <p className="text-theme-text-muted font-medium">
                Real-time garment logistics and status synchronization terminal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="flex items-center gap-2 px-5 py-3 bg-background border border-theme-border rounded-2xl text-emerald-500 font-black text-[10px] uppercase tracking-widest shadow-sm">
              <span className="material-symbols-outlined text-sm status-dot-pulse">sensors</span>
              Terminal Online
            </div>
          </div>
        </div>

        {/* Scanner Input Area */}
        <div className="max-w-3xl mx-auto w-full group">
          <div className="relative overflow-hidden bg-surface border-2 border-theme-border rounded-[2.5rem] p-3 shadow-2xl focus-within:border-emerald-500/50 transition-all duration-500">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-background border border-theme-border flex items-center justify-center text-theme-text-muted/50 group-focus-within:text-emerald-500 group-focus-within:border-emerald-500/20 transition-all">
                <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
              </div>
              <input
                ref={inputRef}
                className="flex-1 bg-transparent border-none outline-none py-4 text-xl font-black text-theme-text placeholder:text-theme-text-muted/30 tracking-tight"
                placeholder="Scan Garment Tag or Enter Order Number..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button 
                className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                  loading ? 'bg-theme-bg text-theme-text-muted' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 active:scale-95'
                }`}
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Execute Search</>
                )}
              </button>
            </div>
            {/* Animated focus border */}
            <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-700 w-0 group-focus-within:w-full"></div>
          </div>
        </div>

        {/* Flash Feedback & Message */}
        {message && (
          <div className={`max-w-3xl mx-auto p-5 rounded-[1.5rem] border animate-fade-in flex items-center justify-between gap-4 ${
            message.includes('✅') 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
              : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
          }`}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">
                {message.includes('✅') ? 'verified' : 'info'}
              </span>
              <span className="text-sm font-black tracking-tight uppercase">{message}</span>
            </div>
            <button onClick={() => setMessage('')} className="text-[10px] font-black opacity-50 hover:opacity-100">DISMISS</button>
          </div>
        )}

        {/* Results View */}
        {results ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Summary Statistics Card */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-surface p-8 rounded-[2.5rem] border border-theme-border shadow-soft relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                
                <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.2em] mb-4">Active Session Detail</p>
                <h3 className="text-3xl font-black tracking-tighter text-theme-text mb-6">{results.order_number}</h3>

                <div className="space-y-5">
                  <div className="flex items-center gap-4 p-4 bg-background border border-theme-border rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-theme-bg border border-theme-border flex items-center justify-center text-theme-text-muted">
                      <span className="material-symbols-outlined text-xl">account_circle</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest">Customer</p>
                      <p className="text-sm font-black text-theme-text">{results.customer_name || 'Retail Client'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-background border border-theme-border rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-theme-bg border border-theme-border flex items-center justify-center text-theme-text-muted">
                      <span className="material-symbols-outlined text-xl">inventory_2</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest">Total Items</p>
                      <p className="text-sm font-black text-theme-text">{results.items?.length || 0} Units</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-theme-border/50">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest">Batch Progression</p>
                      <p className="text-2xl font-black text-emerald-500">
                        {Math.round((results.items?.filter(i => i.status === 'ready' || i.status === 'delivered').length / results.items?.length) * 100) || 0}%
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-background h-3 rounded-full overflow-hidden border border-theme-border">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      style={{ width: `${(results.items?.filter(i => i.status === 'ready' || i.status === 'delivered').length / results.items?.length) * 100 || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Production Grid */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-theme-text-muted">
                  Production Buffer ({results.items?.length || 0} Items)
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {results.items?.map((item, i) => (
                  <div 
                    key={item.id} 
                    className="group relative bg-surface rounded-[2rem] border border-theme-border p-6 shadow-sm hover:shadow-xl hover:border-emerald-500/30 transition-all duration-500 animate-fade-in-up overflow-hidden"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {updatingItem === item.id && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-[4px] rounded-[2rem] z-20 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-black tracking-widest text-emerald-600 animate-pulse">UPDATING LEDGER</span>
                      </div>
                    )}

                    {/* Progress Indicator Side Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-2 transition-colors duration-500 ${
                      item.status === 'ready' ? 'bg-emerald-500' : 'bg-theme-text-muted/20'
                    }`} />
                    
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-lg font-black tracking-tight text-theme-text group-hover:text-emerald-500 transition-colors">{item.garment_type}</h4>
                        <p className="text-[9px] font-black text-theme-text-muted uppercase tracking-[0.2em]">{item.service_type}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                        item.status === 'ready' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-background border-theme-border text-theme-text-muted/30'
                      }`}>
                        <span className="material-symbols-outlined text-[22px]">
                          {item.status === 'ready' ? 'verified' : 'styler'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between mt-8">
                      <div>
                        <p className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest mb-1">Current Sector</p>
                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                          statusColorClasses(item.status)
                        }`}>
                          {STAGE_LABELS[item.status]}
                        </span>
                      </div>
                      
                      {canAdvance && !['ready', 'delivered'].includes(item.status) ? (
                        <button 
                          className="flex items-center gap-2 px-4 py-2 bg-theme-bg border border-theme-border text-[9px] font-black text-theme-text-muted hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-xl transition-all group/btn"
                          onClick={() => advanceItem(item.id)}
                        >
                          ADVANCE
                          <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_right_alt</span>
                        </button>
                      ) : (
                        <span className="material-symbols-outlined text-emerald-500/40 text-2xl">task_alt</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Empty Idle State */
          !message && (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 animate-fade-in-up">
              <div className="relative">
                <div className="w-32 h-32 rounded-[2.5rem] bg-surface flex items-center justify-center text-emerald-500/20 shadow-inner group">
                  <span className="material-symbols-outlined text-6xl group-hover:scale-110 transition-transform duration-700">radar</span>
                </div>
                <div className="absolute -inset-6 rounded-full border border-dashed border-emerald-500/10 animate-spin-slow" />
                <div className="absolute -inset-10 rounded-full border border-dashed border-emerald-500/5 animate-reverse-spin-slow" />
              </div>
              <div className="max-w-md">
                <h2 className="text-3xl font-black tracking-tighter text-theme-text">Awaiting Batch Input</h2>
                <p className="text-theme-text-muted font-medium mt-3 leading-relaxed">
                  Terminal is active and listening for QR signatures. <br/>
                  Scan a garment tag to synchronize the production flow.
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function statusColorClasses(status) {
  const map = {
    ready: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    washing: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    received: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    delivered: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    ironing: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };
  return map[status] || 'bg-theme-bg text-theme-text-muted border-theme-border';
}
