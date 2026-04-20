'use client';

import { useState, Suspense } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, ROLES } from '@/lib/UserContext';
import Link from 'next/link';
import Script from 'next/script';
import { PRICING_MARKETS, TIERS } from '@/lib/tier-config';

function SignupForm() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { fetchUser } = useUser();

  const tierKey = searchParams.get('tier') || 'software_only';
  const marketId = searchParams.get('market') || 'us';
  const tier = TIERS[tierKey] || TIERS.software_only;
  const market = PRICING_MARKETS[marketId] || PRICING_MARKETS.us;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);

  const priceStr = market.prices[tierKey] || '0';
  const amount = parseFloat(priceStr.replace(/,/g, ''));

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (tierKey === 'enterprise') {
      router.push('/contact');
      return;
    }
    
    setPaymentStep(true);
  };

  const finalizeSignup = async (paymentDetails = {}) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          role: ROLES.ADMIN, // Default to owner/admin for new signups
          tier: tierKey,
          market: marketId,
          ...paymentDetails
        }),
      });

      const data = await res.json();

      if (res.ok) {
        await fetchUser();
        router.push('/');
      } else {
        setError(data.error || t('signup_failed'));
        setPaymentStep(false);
      }
    } catch (err) {
      setError(t('network_error'));
      setPaymentStep(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // 1. Initialize order on server
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: amount, 
          order_id: `sub_${Date.now()}`, // Temporary ID for SaaS sub
          is_saas_signup: true 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment');

      // 2. Open Razorpay Modal
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "DrycleanersFlow",
        description: `Subscription: ${tier.label}`,
        order_id: data.order_id,
        handler: async function (response) {
          await finalizeSignup({
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id,
            signature: response.razorpay_signature
          });
        },
        prefill: {
          name: name,
          email: email,
        },
        theme: {
          color: "#10b981",
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-700">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="mb-4 flex justify-center">
        <Link href="/pricing" className="rounded-full border border-emerald-100 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
          {t('change_plan')}
        </Link>
      </div>

      <div className="glass-panel p-10 rounded-[3.5rem] border border-white bg-white/40 shadow-[0_32px_64px_-16px_rgba(11,28,48,0.1)]">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-[1.5rem] primary-gradient flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-emerald-900/20 mx-auto mb-6 transition-transform hover:scale-110">
            {tier.icon ? <span className="material-symbols-outlined text-3xl">{tier.icon}</span> : 'C'}
          </div>
          <h1 className="text-3xl font-black text-on-surface font-headline uppercase tracking-tight mb-2">
            {paymentStep ? t('finalize_payment') : `${t('get_started_with')} ${tier.label}`}
          </h1>
          <p className="text-xs font-black text-on-surface-variant uppercase tracking-[0.3em]">
            {paymentStep ? `${market.currency}${priceStr} / month` : t('create_atelier_profile')}
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
            <span className="material-symbols-outlined text-lg">error</span>
            <p className="text-[11px] font-black uppercase tracking-tight">{error}</p>
          </div>
        )}

        {!paymentStep ? (
          <form onSubmit={handleInitialSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">{t('full_name')}</label>
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
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">{t('digital_identity')}</label>
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
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">{t('security_key')}</label>
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
              <span className="relative z-10">{t('continue_to_payment')}</span>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500 skew-x-12"></div>
            </button>
          </form>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 space-y-4">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-emerald-800">
                <span>{tier.label}</span>
                <span>{market.currency}{priceStr}</span>
              </div>
              <div className="h-px bg-emerald-200/50" />
              <div className="flex justify-between items-center text-sm font-black text-emerald-950">
                <span>{t('total_due_now')}</span>
                <span>{market.currency}{priceStr}</span>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handlePayment}
                className="w-full primary-gradient text-white py-5 rounded-[2.5rem] font-black text-sm shadow-2xl shadow-emerald-900/10 hover:shadow-emerald-900/30 active:scale-95 transition-all disabled:opacity-50 overflow-hidden relative group"
                disabled={loading}
              >
                <span className="relative z-10">{loading ? t('processing') : t('pay_and_activate')}</span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500 skew-x-12"></div>
              </button>
              
              <button 
                onClick={() => setPaymentStep(false)}
                className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                disabled={loading}
              >
                {t('go_back')}
              </button>
            </div>
          </div>
        )}

        <div className="text-center mt-10">
          <p className="text-[11px] font-bold text-slate-400">
            Already have a profile? <button onClick={() => router.push('/login')} className="text-primary font-black hover:underline ml-1">{t('sign_in')}</button>
          </p>
        </div>
      </div>
      
      <p className="text-center mt-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Pristine Atelier v2.4.0</p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/30 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>

      <Suspense fallback={<div className="text-emerald-600 animate-pulse font-black uppercase tracking-widest">Loading Atelier...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
