'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useUser, ROLES } from '@/lib/UserContext';

function RegisterForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const { fetchUser } = useUser();

  const [loadingPage, setLoadingPage] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const paymentVerified = sessionStorage.getItem('payment_verified');
    if (paymentVerified !== 'true') {
      router.replace('/pricing');
      return;
    }

    try {
      const planData = JSON.parse(sessionStorage.getItem('selected_plan') || '{}');
      setSelectedPlan(planData);
    } catch (err) {
      console.error('Failed to parse plan data', err);
    }

    setLoadingPage(false);
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let paymentDetails = {};
      try {
        paymentDetails = JSON.parse(sessionStorage.getItem('payment_details') || '{}');
      } catch (err) {
        console.error('Failed to parse payment details', err);
      }

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          role: ROLES?.ADMIN || 'owner',
          tier: selectedPlan?.tier || 'software_only',
          market: selectedPlan?.market || 'us',
          ...paymentDetails
        }),
      });

      const data = await res.json();

      if (res.ok) {
        sessionStorage.removeItem('payment_verified');
        sessionStorage.removeItem('selected_plan');
        sessionStorage.removeItem('payment_details');
        
        await fetchUser();
        router.push('/');
      } else {
        setError(data.error || t('signup_failed') || 'Signup failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setError(t('network_error') || 'A network error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (loadingPage) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const currencyMap = {
    'us': '$',
    'europe': '€',
    'uae': 'AED',
    'india': '₹',
    'latam': '$'
  };
  const currencySymbol = selectedPlan?.market ? currencyMap[selectedPlan.market] : '';

  return (
    <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-700">
      <div className="glass-panel p-10 rounded-[3.5rem] border border-white bg-white/40 shadow-[0_32px_64px_-16px_rgba(11,28,48,0.1)]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-[1.5rem] primary-gradient flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-emerald-900/20 mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <h1 className="text-3xl font-black text-on-surface font-headline uppercase tracking-tight mb-2">
            Create Profile
          </h1>
          <p className="text-xs font-black text-on-surface-variant uppercase tracking-[0.3em]">
            Payment Successful
          </p>
        </div>

        {selectedPlan && (
          <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between text-emerald-800">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mb-1">Selected Plan</p>
              <p className="text-sm font-black">{selectedPlan.plan}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mb-1">Total</p>
              <p className="text-sm font-black">{currencySymbol}{selectedPlan.total}/mo</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
            <span className="material-symbols-outlined text-lg">error</span>
            <p className="text-[11px] font-black uppercase tracking-tight">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">{t('full_name') || 'Full Name'}</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg">person</span>
              <input 
                type="text" 
                className="w-full bg-white/80 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold shadow-inner focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-200"
                value={name} 
                onChange={e => setName(e.target.value)}
                required 
                placeholder="Christian Dior"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">{t('digital_identity') || 'Email Address'}</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg">mail</span>
              <input 
                type="email" 
                className="w-full bg-white/80 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold shadow-inner focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-200"
                value={email} 
                onChange={e => setEmail(e.target.value)}
                required 
                placeholder="dior@atelier.io"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">{t('security_key') || 'Password'}</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg">lock</span>
              <input 
                type="password" 
                className="w-full bg-white/80 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold shadow-inner focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-200"
                value={password} 
                onChange={e => setPassword(e.target.value)}
                required 
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full primary-gradient text-white py-5 rounded-[2.5rem] font-black text-sm shadow-2xl shadow-emerald-900/10 hover:shadow-emerald-900/30 active:scale-95 transition-all mt-4 disabled:opacity-50 overflow-hidden relative group"
            disabled={loading}
          >
            <span className="relative z-10">{loading ? (t('processing') || 'Processing...') : 'Complete Registration'}</span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500 skew-x-12"></div>
          </button>
        </form>
      </div>
      
      <p className="text-center mt-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Pristine Atelier v2.4.0</p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-6 relative overflow-y-auto overflow-x-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/30 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>

      <Suspense fallback={<div className="text-emerald-600 animate-pulse font-black uppercase tracking-widest">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
