'use client';

import { useState, Suspense, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { PRICING_MARKETS, TIERS, ADD_ONS, getAddonPricing } from '@/lib/tier-config';

function CheckoutForm() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tierKey = searchParams.get('tier') || 'software_only';
  const marketId = searchParams.get('market') || 'us';
  const planNameQuery = searchParams.get('planName');
  
  const tier = TIERS[tierKey] || TIERS.software_only;
  const market = PRICING_MARKETS[marketId] || PRICING_MARKETS.us;
  const planName = planNameQuery || tier.label;

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState([]);

  const priceStr = searchParams.get('price') || market.prices[tierKey] || '0';
  const baseAmount = parseFloat(priceStr.toString().replace(/,/g, ''));
  
  const addonsSummary = selectedAddons.reduce((summary, id) => {
    const addon = ADD_ONS.find(a => a.id === id);
    if (!addon) return summary;
    const pricing = getAddonPricing(addon, marketId);
    if (pricing.billing === 'one_time') {
      summary.oneTime += pricing.amount;
    } else {
      summary.monthly += pricing.amount;
    }
    return summary;
  }, { monthly: 0, oneTime: 0 });
  
  const monthlyTotal = baseAmount + addonsSummary.monthly;
  const totalAmount = monthlyTotal + addonsSummary.oneTime;

  // Helper for human-readable translation fallbacks
  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  const toggleAddon = (id) => {
    setSelectedAddons(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: totalAmount, 
          order_id: `sub_${Date.now()}`, 
          is_saas_signup: true,
          addons: selectedAddons,
          market: marketId
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment gateway');

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "DrycleanersFlow",
        description: `Subscription: ${planName}`,
        order_id: data.order_id,
        handler: function (response) {
          sessionStorage.setItem("payment_verified", "true");
          sessionStorage.setItem("selected_plan", JSON.stringify({ 
            tier: tierKey, 
            market: marketId, 
            plan: planName, 
            addOns: selectedAddons, 
            total: totalAmount 
          }));
          sessionStorage.setItem("payment_details", JSON.stringify({
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id,
            signature: response.razorpay_signature,
            provider: 'razorpay'
          }));
          router.push('/register');
        },
        theme: { color: "#10b981" },
        modal: { ondismiss: () => setLoading(false) }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setError(response.error.description || 'Payment failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl relative z-10 animate-fade-in-up">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="mb-8 flex justify-center">
        <Link href="/pricing" className="group flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-800 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:scale-105 active:scale-95">
          <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-1">arrow_back</span>
          {translate('change_plan', 'Change Plan')}
        </Link>
      </div>

      <div className="glass-panel p-1 border-white/60 rounded-[3.5rem] shadow-2xl overflow-hidden">
        <div className="bg-white/40 backdrop-blur-2xl p-10 md:p-14 rounded-[3.25rem]">
          <div className="text-center mb-12">
            <div className="w-20 h-20 rounded-[2rem] primary-gradient flex items-center justify-center text-white shadow-2xl shadow-emerald-900/20 mx-auto mb-8 animate-float">
              <span className="material-symbols-outlined text-4xl">{tier.icon || 'star'}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-emerald-950 font-headline tracking-tighter mb-3">
              {translate('finalize_payment', 'Finalize Payment')}
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/50 border border-emerald-200/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs font-black text-emerald-800 uppercase tracking-[0.25em]">
                {market.currency}{baseAmount} / {translate('month', 'month')}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-10 p-5 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-3xl flex items-center gap-4 text-red-600 animate-in slide-in-from-top-4 duration-500">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">error</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-tight leading-relaxed">{error}</p>
            </div>
          )}

          <div className="space-y-10">
            <div className="p-8 rounded-[2.5rem] bg-emerald-50/50 border border-emerald-100/50 shadow-inner relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-emerald-900">verified_user</span>
              </div>
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">Selected Plan</p>
                  <h3 className="text-xl font-black text-emerald-950">{planName}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-emerald-950">{market.currency}{baseAmount}</span>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">/ month</p>
                </div>
              </div>
              
              <div className="pt-6 mt-6 border-t border-emerald-200/30 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 mb-4">Optional Enhancements</p>
                <div className="grid gap-3">
                  {ADD_ONS.map((addon, idx) => {
                    const addonPricing = getAddonPricing(addon, marketId);
                    const isSelected = selectedAddons.includes(addon.id);
                    return (
                    <div 
                      key={addon.id} 
                      onClick={() => toggleAddon(addon.id)} 
                      className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${isSelected ? 'bg-white border-emerald-300 shadow-md scale-[1.02]' : 'bg-transparent border-emerald-200/50 hover:bg-white/40 hover:border-emerald-200'}`}
                      style={{ transitionDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-lg shadow-emerald-500/20' : 'bg-white border-emerald-200'}`}>
                          {isSelected && <span className="material-symbols-outlined text-white text-base font-bold">check</span>}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-950 leading-none mb-1">{addon.label}</p>
                          <p className="text-[9px] font-medium text-emerald-600 uppercase tracking-tighter">
                            {addonPricing.billing === 'one_time' ? 'One-time purchase' : 'Billed monthly'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-900">
                        +{market.currency}{addonPricing.amount} {addonPricing.period}
                      </span>
                    </div>
                  )})}
                </div>
              </div>

              <div className="mt-8 pt-8 border-t-2 border-dashed border-emerald-200/50 space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700">
                  <span>Monthly subscription total</span>
                  <span>{market.currency}{monthlyTotal}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700">
                  <span>One-time setup/add-ons</span>
                  <span>{market.currency}{addonsSummary.oneTime}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-black text-emerald-950 uppercase tracking-widest">{translate('total_due_now', 'Total Due Now')}</span>
                <div className="text-right">
                  <span className="text-3xl font-black text-emerald-950 tracking-tighter">{market.currency}{totalAmount}</span>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">First payment</p>
                </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <button 
                onClick={handlePayment}
                className="w-full primary-gradient text-white py-6 rounded-3xl font-black text-base shadow-2xl shadow-emerald-900/20 hover:shadow-emerald-900/40 active:scale-[0.98] transition-all disabled:opacity-50 overflow-hidden relative group shimmer-button"
                disabled={loading}
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span className="uppercase tracking-widest text-sm">{translate('processing', 'Processing...')}</span>
                    </>
                  ) : (
                    <>
                      <span className="uppercase tracking-[0.2em] text-sm">Confirm & Proceed to Payment</span>
                      <span className="material-symbols-outlined">payments</span>
                    </>
                  )}
                </div>
              </button>
              
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <span className="material-symbols-outlined text-sm">lock</span>
                <p className="text-[10px] font-bold uppercase tracking-widest">Secure 256-bit SSL Encryption</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12 pt-8 border-t border-emerald-100/50">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {translate('already_have_profile', 'Already have a profile?')} 
              <button onClick={() => router.push('/login')} className="text-emerald-600 font-black hover:underline ml-2 transition-colors">
                {translate('sign_in', 'Sign in')}
              </button>
            </p>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-10 space-y-2">
        <p className="text-[10px] font-black text-emerald-900/30 uppercase tracking-[0.6em]">Pristine Atelier v2.5.0</p>
        <p className="text-[9px] font-bold text-emerald-900/20 uppercase tracking-[0.2em]">&copy; 2024 CleanFlow Systems. All Rights Reserved.</p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen mesh-background flex items-center justify-center p-8 relative">
      {/* Dynamic Orbs */}
      <div className="glass-orb w-[40vw] h-[40vw] bg-emerald-300 top-[-10%] left-[-10%] delay-300"></div>
      <div className="glass-orb w-[35vw] h-[35vw] bg-teal-200 bottom-[-5%] right-[-5%] animation-delay-700"></div>
      <div className="glass-orb w-[20vw] h-[20vw] bg-lime-100 top-[20%] right-[10%] delay-500"></div>

      <Suspense fallback={
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100"></div>
          <div className="h-4 w-48 bg-emerald-100 rounded-full"></div>
        </div>
      }>
        <CheckoutForm />
      </Suspense>
    </div>
  );
}
