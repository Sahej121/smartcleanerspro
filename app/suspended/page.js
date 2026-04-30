'use client';
import Link from 'next/link';

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 animate-fade-in relative overflow-y-auto overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-300 rounded-full mix-blend-multiply filter blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-200 rounded-full mix-blend-multiply filter blur-[120px]"></div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-slate-200/50 p-10 lg:p-14 max-w-lg w-full text-center border border-white relative overflow-hidden group z-10">
        <div className="relative z-10">
          <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-red-100 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
            <span className="material-symbols-outlined text-5xl drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 font-headline mb-4 tracking-tight">
            Account Inactive
          </h1>
          
          <p className="text-slate-500 font-medium leading-relaxed mb-10 text-sm">
            Your store access has been temporarily suspended. This is typically due to an **unpaid invoice**, 
            an expired subscription, or a required security update from the root administrator.
          </p>
          
          <div className="flex flex-col gap-4">
            <a 
              href="mailto:support@smartcleanerspro.com" 
              className="w-full py-5 bg-red-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-red-900/20 active:scale-95 transition-all hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">mail</span>
              Contact Support
            </a>
            <Link 
              href="/login" 
              className="w-full py-5 bg-slate-50 text-slate-500 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] border border-slate-100 hover:bg-slate-100 hover:text-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back to Login
            </Link>
          </div>
        </div>

        <p className="mt-12 text-[9px] font-black uppercase text-slate-300 tracking-[0.3em] relative z-10 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-xs">shield</span>
          Secured by DrycleanersFlow
        </p>
      </div>
    </div>
  );
}
