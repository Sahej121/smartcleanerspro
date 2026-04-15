'use client';

import { useRouter } from 'next/navigation';
import { TIERS, ADD_ONS } from '@/lib/tier-config';
import MarketingNavbar from '@/components/marketing/MarketingNavbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';

export default function PricingLandingPage() {
  const router = useRouter();

  const handleStart = (tierKey) => {
    if (tierKey === 'enterprise') {
      router.push('/contact');
      return;
    }
    router.push(`/signup?tier=${tierKey}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-slate-900 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <MarketingNavbar />
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-100/40 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/30 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* SEO & Header Section */}
      <header className="relative z-10 pt-20 pb-16 text-center px-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Aligned with DrycleanersFlow v2.4</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mb-6 font-headline leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          Simple Pricing for<br />
          <span className="text-emerald-700">Modern Ateliers</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-slate-500 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          Move beyond outdated systems. Choose a plan that fuels your growth with automated workflows, real-time tracking, and premium hardware.
        </p>
      </header>

      {/* Pricing Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {Object.entries(TIERS).map(([key, tier], idx) => (
            <div 
              key={key}
              className={`group glass-panel rounded-[3.5rem] border border-white p-10 lg:p-14 shadow-[0_32px_64px_-16px_rgba(11,28,48,0.08)] hover:shadow-[0_48px_96px_-24px_rgba(16,185,129,0.12)] transition-all duration-500 relative flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700 stagger-${idx+1}`}
            >
              {key === 'hardware_bundle' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl">
                  Most Popular
                </div>
              )}

              <div className="mb-10">
                <div className={`w-16 h-16 rounded-3xl ${key === 'hardware_bundle' ? 'bg-emerald-600' : 'bg-slate-900'} text-white flex items-center justify-center mb-8 shadow-2xl transition-transform group-hover:scale-110 duration-500`}>
                  <span className="material-symbols-outlined text-3xl">{tier.icon}</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2 font-headline">{tier.label}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">{tier.price}</span>
                  {key !== 'enterprise' ? (
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">/ Month</span>
                  ) : null}
                </div>
              </div>

              <ul className="space-y-5 mb-12 flex-1">
                {tier.features.map((feature, fidx) => (
                  <li key={fidx} className="flex items-start gap-3.5 text-slate-600 font-medium">
                    <span className="material-symbols-outlined text-emerald-500 text-xl shrink-0">check_circle</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="space-y-4 pt-10 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Support Coverage</p>
                <div className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 mb-8">
                  <span className="material-symbols-outlined text-slate-400">headset_mic</span>
                  <span className="text-xs font-bold text-slate-600">{tier.support}</span>
                </div>
                <button 
                  onClick={() => handleStart(key)}
                  className={`w-full py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl relative overflow-hidden group/btn ${
                    key === 'hardware_bundle' ? 'primary-gradient text-white shadow-emerald-900/10' : 'bg-slate-900 text-white shadow-slate-900/10'
                  }`}
                >
                  <span className="relative z-10">{key === 'enterprise' ? 'Contact Sales' : `Get Started with ${tier.label}`}</span>
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[0%] transition-transform duration-500 skew-x-12"></div>
                </button>
              </div>

              {/* Hardware Visual for Bundle */}
              {key === 'hardware_bundle' && (
                <div className="absolute bottom-10 right-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000">
                  <span className="material-symbols-outlined text-[120px]">terminal</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Add-Ons Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter font-headline mb-4">Add-Ons For Every Tier</h2>
          <p className="text-slate-500 font-medium uppercase tracking-[0.3em] text-[10px]">Optional upgrades available on Software, Hardware Bundle, and Enterprise plans</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ADD_ONS.map((addon) => (
            <div key={addon.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-emerald-200 transition-all hover:shadow-xl hover:shadow-emerald-900/5 group">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-6 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <span className="material-symbols-outlined text-2xl">{addon.icon}</span>
              </div>
              <h4 className="text-sm font-black text-slate-900 mb-1">{addon.label}</h4>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 tracking-tighter">{addon.price}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">{addon.period}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 bg-slate-900 py-32 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/5 rounded-full border border-white/10 mb-10">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Unmatched Performance</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black font-headline mb-8 leading-tight">
            The only POS designed for<br />
            <span className="italic">Production Speed</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg mb-12 font-medium">
            Join 500+ ateliers who switched to DrycleanersFlow. No hidden fees. No long-term contracts. Just pristine operations.
          </p>
          <button 
            onClick={() => router.push('/signup')}
            className="px-12 py-6 primary-gradient text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all"
          >
            Start Your 14-Day Free Tier
          </button>
          
          <div className="mt-20 pt-20 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-12 text-left opacity-60 hover:opacity-100 transition-opacity">
            <div>
              <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4">Cloud Native</h5>
              <p className="text-xs font-medium leading-loose">Built on globally distributed edge nodes for zero-latency operations during peak induction hours.</p>
            </div>
            <div>
              <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4">Security Protocol</h5>
              <p className="text-xs font-medium leading-loose">Enterprise-grade encryption for all customer data and financial transactions. PCI-DSS compliant.</p>
            </div>
            <div>
              <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4">API First</h5>
              <p className="text-xs font-medium leading-loose">Connect your existing accounting tools or custom websites via our high-performance REST API.</p>
            </div>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}
