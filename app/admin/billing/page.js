'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TIERS } from '@/lib/tier-config';

export default function BillingPage() {
  const router = useRouter();
  const [currentTier, setCurrentTier] = useState('software_only');
  const [stores, setStores] = useState([]);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch('/api/stores');
        if (res.ok) {
          const data = await res.json();
          setStores(data);
          if (data.length > 0) {
            setCurrentTier(data[0].subscription_tier || 'software_only');
          }
        }
      } catch (e) {
        console.error('Failed to fetch stores', e);
      }
    };
    fetchStores();
  }, []);

  const getTierDisplayPrice = (tierPrice) => {
    if (!isYearly) return tierPrice;
    const base = parseFloat(tierPrice.replace(/[^0-9.]/g, ''));
    return `₹${Math.round(base * 0.8).toLocaleString('en-IN')}/mo`;
  };

  const TIERS_ARRAY = Object.entries(TIERS).map(([key, config]) => ({ id: key, ...config }));

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background p-6 lg:p-12 font-sans overflow-x-hidden selection:bg-primary/30 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-12 animate-fade-in-up">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-container px-4 py-2 rounded-[1rem] border border-transparent hover:border-theme-border transition-all w-fit active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Go Back
          </button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-theme-border pb-12 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-4xl text-primary bg-primary/10 p-3 rounded-[1.5rem] border border-primary/20 shadow-sm">workspaces</span>
                <h1 className="text-4xl font-black text-theme-text tracking-tighter font-headline">Subscription & Plans</h1>
              </div>
              <p className="text-theme-text-muted font-bold ml-1 text-lg">Power up your production floor with premium tools.</p>
            </div>
            <div className="flex items-center gap-2 bg-surface p-2 rounded-[2rem] shadow-sm border border-theme-border">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${!isYearly ? 'bg-theme-text text-background shadow-md' : 'text-theme-text-muted hover:bg-theme-surface-container'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-6 py-3 flex items-center gap-2 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${isYearly ? 'bg-theme-text text-background shadow-md' : 'text-theme-text-muted hover:bg-theme-surface-container'}`}
              >
                Yearly <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[8px] animate-pulse font-black border border-primary/30">SAVE 20%</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          {TIERS_ARRAY.map((plan, idx) => {
            const isEnterprise = plan.id === 'enterprise';
            const isCurrent = currentTier === plan.id;
            const isHardware = plan.id === 'hardware_bundle';

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col p-8 lg:p-10 rounded-[3rem] transition-all duration-500 hover:-translate-y-2 group overflow-hidden ${
                  isEnterprise
                    ? 'bg-theme-surface border border-theme-border shadow-lg transition-all'
                    : isHardware
                      ? 'bg-surface border border-primary/50 shadow-[0_32px_64px_-16px_rgba(16,185,129,0.1)] ring-2 ring-primary/5'
                      : 'bg-surface shadow-xl border border-theme-border hover:border-theme-text/20'
                }`}
              >
                {isEnterprise && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary/50" />
                )}

                {isCurrent && (
                  <div className="absolute top-8 right-8 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border z-20 bg-primary/10 text-primary border-primary/20 shadow-sm animate-pulse">
                    Current Plan
                  </div>
                )}
                {!isCurrent && isHardware && (
                  <div className="absolute top-8 right-8 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-full z-20 primary-gradient text-white shadow-lg shadow-primary/20">
                    Popular
                  </div>
                )}
                {!isCurrent && isEnterprise && (
                  <div className="absolute top-8 right-8 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-full z-20 bg-theme-text text-background shadow-lg">
                    Highest Tier
                  </div>
                )}

                <div className="mb-10 relative z-10 pt-2">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center mb-6 shadow-lg relative ${
                    isEnterprise ? 'primary-gradient text-white shadow-primary/30' :
                    isHardware ? 'bg-primary/20 text-primary blur-0 shadow-primary/10 border border-primary/20' :
                    'bg-theme-surface-container text-theme-text border border-theme-border'
                  }`}>
                    <span className="material-symbols-outlined text-2xl">{plan.icon}</span>
                    {isEnterprise && <span className="material-symbols-outlined absolute -top-2 -right-2 text-primary bg-background rounded-full p-0.5 border border-primary/20 text-[14px]">workspace_premium</span>}
                  </div>

                  <h3 className={`text-[12px] font-black uppercase tracking-[0.3em] mb-4 ${isEnterprise ? 'text-primary' : isHardware ? 'text-theme-text' : 'text-theme-text-muted'}`}>
                    {plan.label}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-5xl lg:text-7xl font-black tracking-tighter font-headline text-theme-text drop-shadow-sm">{getTierDisplayPrice(plan.price)}</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[18px] ${isEnterprise ? 'text-primary' : 'text-theme-text-muted'}`}>storefront</span>
                      <span className="text-sm font-bold text-theme-text">{plan.maxStores === -1 ? 'Unlimited Stores' : `Up to ${plan.maxStores} Store${plan.maxStores > 1 ? 's' : ''}`}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[18px] ${isEnterprise ? 'text-primary' : 'text-theme-text-muted'}`}>group</span>
                      <span className="text-sm font-bold text-theme-text">{plan.maxStaffPerStore === -1 ? 'Unlimited Staff' : `Up to ${plan.maxStaffPerStore} Staff/store`}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4 mb-10 relative z-10 pt-8 border-t border-theme-border">
                  {plan.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-start gap-4">
                      <span className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${
                        isEnterprise ? 'text-primary' : 
                        isHardware ? 'text-primary' : 
                        'text-theme-text-muted'
                      }`}>check_circle</span>
                      <span className="text-sm font-bold leading-snug text-theme-text-muted">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  disabled={isCurrent}
                  onClick={() => {
                    if (isCurrent) return;
                    if (isEnterprise) router.push('/enterprise-upgrade');
                    else router.push('/admin/settings');
                  }}
                  className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 shrink-0 relative z-10 ${
                    isCurrent
                      ? 'bg-theme-surface-container text-theme-text-muted border border-theme-border cursor-default opacity-60'
                      : isEnterprise
                        ? 'bg-theme-text text-background shadow-lg active:scale-95 hover:brightness-110'
                        : isHardware
                          ? 'bg-theme-text text-background shadow-lg shadow-theme-text/20 active:scale-95 hover:brightness-110'
                          : 'bg-theme-surface-container border border-theme-border hover:border-theme-text/30 text-theme-text active:scale-95'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : isEnterprise ? 'Contact Sales' : `Upgrade to ${plan.label.split(' ')[0]}`}
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-12 md:p-16 bg-surface border border-theme-border rounded-[3rem] text-center space-y-6 relative overflow-hidden group shadow-sm mt-12 block">
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-theme-text tracking-tighter font-headline flex justify-center items-center gap-3">
              Need custom hardware integrations?
              <span className="material-symbols-outlined text-primary text-4xl">inventory_2</span>
            </h2>
            <p className="text-theme-text-muted font-bold text-sm max-w-2xl mx-auto leading-relaxed">
              Our enterprise team can build specialized workflows, wet ticket routing, automated garment bagging machines integration, and complete POS terminal deployment on-site globally.
            </p>
            <button
              onClick={() => router.push('/enterprise-upgrade')}
              className="inline-flex items-center gap-3 px-8 py-5 bg-theme-text text-background rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-transform shadow-lg hover:brightness-110"
            >
              Contact Sales Architect
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
