'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const PROVISIONING_STEPS = [
  { id: 1, label: 'Initializing Secure Tunnel', duration: 2500 },
  { id: 2, label: 'Provisioning Enterprise Node', duration: 3000 },
  { id: 3, label: 'Validating Encryption Keys', duration: 2000 },
  { id: 4, label: 'Synchronizing Database Matrix', duration: 3500 },
  { id: 5, label: 'Finishing Protocol Deployment', duration: 2000 }
];

const LOGIN_STEPS = [
  { id: 1, label: 'Authenticating Protocol', duration: 800 },
  { id: 2, label: 'Synchronizing Session Data', duration: 1000 },
  { id: 3, label: 'Validating Enterprise Shield', duration: 600 },
  { id: 4, label: 'Decrypting Dashboard Matrix', duration: 1200 },
  { id: 5, label: 'Initializing Workspace', duration: 600 }
];

function BubbleMatrix() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => {
        const size = Math.random() * 100 + 50;
        const left = Math.random() * 100;
        const delay = Math.random() * 10;
        const duration = Math.random() * 20 + 10;
        const opacity = Math.random() * 0.1 + 0.05;
        
        return (
          <div 
            key={i}
            className="absolute rounded-full bg-emerald-500 blur-xl animate-bubble"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              bottom: '-20%',
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              opacity: opacity,
              filter: `blur(${Math.random() * 40 + 20}px)`
            }}
          ></div>
        );
      })}
    </div>
  );
}

function WaitingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const origin = searchParams.get('origin');
  const isLogin = origin === 'login';
  const steps = isLogin ? LOGIN_STEPS : PROVISIONING_STEPS;

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let stepTimer;
    let progressTimer;

    const runSequence = async () => {
      // Prefetch target routes to make the transition instant
      router.prefetch('/');
      router.prefetch('/admin');

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        const duration = steps[i].duration;
        const startTime = Date.now();
        
        progressTimer = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const stepBase = (i / steps.length) * 100;
          const stepProgress = Math.min((elapsed / duration) * (100 / steps.length), 100 / steps.length);
          setProgress(stepBase + stepProgress);
        }, 50);

        await new Promise(resolve => {
          stepTimer = setTimeout(resolve, duration);
        });
        clearInterval(progressTimer);
      }
      setProgress(100);
      
      // Auto-redirect for login flow
      if (isLogin) {
        setTimeout(() => {
          router.push('/');
        }, 1000);
      }
    };

    runSequence();

    return () => {
      clearTimeout(stepTimer);
      clearInterval(progressTimer);
    };
  }, [steps, isLogin, router]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 lg:p-12 selection:bg-emerald-500/30 overflow-y-auto overflow-x-hidden font-sans relative">
      <BubbleMatrix />
      
      {/* Dynamic Background Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px] animate-float-slow opacity-40"></div>
        <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[140px] animate-breathe opacity-30"></div>
      </div>

      <div className="max-w-xl w-full relative z-10 space-y-12 text-center animate-fade-in-up">
        
        {/* Central Animated Logo/Ring */}
        <div className="relative w-48 h-48 mx-auto mb-16">
          <div className="absolute inset-[-20px] rounded-full border border-emerald-500/10 animate-pulse-ring-rich"></div>
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/20 animate-spin-slow"></div>
          <div className="absolute inset-4 rounded-full border border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <div className="absolute inset-12 rounded-3xl bg-zinc-900 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] flex items-center justify-center group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-50"></div>
             <span className="material-symbols-outlined text-4xl text-emerald-500 animate-pulse">
               {isLogin ? 'verified_user' : 'shield_locked'}
             </span>
          </div>
          <div className="absolute inset-0 animate-orbit">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.8)]"></div>
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/80">
              {isLogin ? 'Authenticating Protocol' : 'Secure Provisioning'}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
            {isLogin ? 'Welcome Back to Your Atelier' : 'Establishing Your Enterprise Environment'}
          </h1>
          <p className="text-zinc-500 font-bold tracking-widest text-[11px] uppercase max-w-sm mx-auto leading-loose pt-2">
            {isLogin 
              ? 'Synchronizing your secure session with the global matrix.' 
              : 'Configuring your dedicated cloud instance and securing the database matrix.'}
          </p>
        </div>

        {/* Progress System */}
        <div className="space-y-8 pt-8 max-w-sm mx-auto">
          <div className="relative group">
            <div className="h-[6px] w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
               <div 
                 className="h-full bg-gradient-to-r from-emerald-600 to-emerald-300 transition-all duration-300 ease-out relative shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                 style={{ width: `${progress}%` }}
               >
               </div>
            </div>
            <div className="absolute -top-8 right-0 text-[10px] font-black text-emerald-500 tabular-nums">
              {Math.floor(progress)}%
            </div>
          </div>

          <div className="space-y-4 text-left">
            {steps.map((step, idx) => (
              <div 
                key={step.id} 
                className={`flex items-center gap-4 transition-all duration-700 ${
                  currentStep === idx ? 'opacity-100 translate-x-1' : currentStep > idx ? 'opacity-40' : 'opacity-20 grayscale'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                  currentStep === idx ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500' : currentStep > idx ? 'border-emerald-500/20 bg-emerald-500/20 text-emerald-500' : 'border-zinc-800 bg-zinc-900 text-zinc-600'
                }`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {currentStep > idx ? 'check' : currentStep === idx ? 'sync' : 'circle'}
                  </span>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${currentStep === idx ? 'text-white' : 'text-zinc-500'}`}>
                  {step.label}
                  {currentStep === idx && <span className="inline-block animate-pulse ml-2 text-emerald-500/50">...</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-12 border-t border-white/5">
           <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] flex items-center justify-center gap-3">
             <span className="material-symbols-outlined text-xs">verified_user</span>
             AES-256 Session Shield Active
           </p>
        </div>
      </div>

      {progress === 100 && !isLogin && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 animate-scale-in">
           <Link href="/admin" className="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-emerald-400 hover:text-black hover:-translate-y-1 transition-all shadow-2xl flex items-center gap-3 group">
             Initialize Dashboard
             <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">rocket_launch</span>
           </Link>
        </div>
      )}

      <style jsx global>{`
        @keyframes bubble {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: var(--tw-bg-opacity, 0.1); }
          50% { transform: translateY(-300px) scale(1.1); }
          80% { opacity: 0; }
          100% { transform: translateY(-600px) scale(1.2); opacity: 0; }
        }
        .animate-bubble {
          animation: bubble linear infinite;
        }
        @keyframes pulse-ring-rich {
          0% { transform: scale(0.7); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.2; }
          100% { transform: scale(0.7); opacity: 0.5; }
        }
        .animate-pulse-ring-rich {
          animation: pulse-ring-rich 4s ease-in-out infinite;
        }
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-orbit {
          animation: orbit 10s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function EnterpriseWaitingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]"></div>}>
      <WaitingContent />
    </Suspense>
  );
}

