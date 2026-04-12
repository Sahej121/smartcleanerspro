'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EnterpriseUpgradePage() {
  const router = useRouter();
  const [phase, setPhase] = useState(0);

  const phases = [
    { text: 'Establishing secure architect tunnel...', icon: 'vpn_lock', color: 'text-indigo-500' },
    { text: 'Allocating dedicated Master Nodes...', icon: 'dns', color: 'text-blue-500' },
    { text: 'Provisioning Assembly Workflow logic...', icon: 'category', color: 'text-emerald-500' },
    { text: 'Awaiting Hardware Architect signature...', icon: 'verified_user', color: 'text-amber-500' },
  ];

  useEffect(() => {
    if (phase < phases.length) {
      const timer = setTimeout(() => {
        setPhase(p => p + 1);
      }, 2500); // 2.5 seconds per phase
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const isComplete = phase >= phases.length;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background text-theme-text font-sans p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Immersive Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-2xl w-full relative z-10">
        {!isComplete ? (
          <div className="bg-surface/80 border border-theme-border backdrop-blur-3xl rounded-[3rem] p-12 text-center shadow-2xl animate-fade-in-up">
            <div className="w-24 h-24 mx-auto rounded-[2rem] bg-theme-surface-container border border-theme-border flex items-center justify-center mb-8 relative shadow-inner">
               <span className={`material-symbols-outlined text-5xl animate-pulse ${phases[phase]?.color || 'text-primary'}`}>
                 {phases[phase]?.icon || 'settings'}
               </span>
               <div className="absolute inset-0 rounded-[2rem] border-2 border-primary/50 border-t-primary animate-spin"></div>
            </div>
            
            <h1 className="text-4xl font-black font-headline tracking-tighter text-theme-text mb-2">Initializing Enterprise...</h1>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-theme-text-muted mb-12 h-6">
              {phases[phase]?.text}
            </p>

            <div className="w-full h-3 bg-theme-surface-container rounded-full overflow-hidden shadow-inner border border-theme-border/50">
               <div 
                 className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                 style={{ width: `${(phase / phases.length) * 100}%` }}
               ></div>
            </div>
          </div>
        ) : (
          <div className="bg-surface border border-primary/30 backdrop-blur-3xl rounded-[3rem] p-12 text-center shadow-[0_30px_60px_rgba(16,185,129,0.1)] animate-scale-in group">
            <div className="absolute inset-0 bg-primary/5 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

            <div className="w-24 h-24 mx-auto rounded-[2rem] primary-gradient text-white flex items-center justify-center mb-8 shadow-lg shadow-primary/30">
               <span className="material-symbols-outlined text-5xl">task_alt</span>
            </div>
            
            <h1 className="text-4xl font-black font-headline tracking-tighter text-theme-text mb-4">Instance Logged</h1>
            <p className="text-sm font-bold text-theme-text-muted leading-relaxed max-w-lg mx-auto mb-10">
              Your request for an Enterprise framework upgrade has been queued. A Dedicated Solutions Architect will review your facility's requirements and finalize the Master Node unlock within 2 hours.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <button 
                 onClick={() => router.push('/')}
                 className="w-full sm:w-auto px-10 py-5 rounded-[1.5rem] bg-theme-surface-container border border-theme-border text-[10px] font-black uppercase tracking-[0.2em] text-theme-text hover:bg-theme-text hover:text-background transition-all active:scale-95"
               >
                 Return to Dashboard
               </button>
               <button 
                 onClick={() => router.push('/support')}
                 className="w-full sm:w-auto px-10 py-5 rounded-[1.5rem] primary-gradient shadow-lg shadow-primary/20 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
               >
                 Open Support Ticket
               </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
