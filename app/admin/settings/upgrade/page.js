'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TIERS, PRICING_MARKETS } from '@/lib/tier-config';

export default function UpgradeTierPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTier, setSelectedTier] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const storeId = searchParams.get('storeId');
  const storeName = searchParams.get('storeName') || 'Store';
  const currentTier = searchParams.get('currentTier') || 'software_only';
  const marketId = searchParams.get('market') || 'us';

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setCurrentUser(d.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedTier(currentTier);
  }, [currentTier]);

  const market = useMemo(() => PRICING_MARKETS[marketId] || PRICING_MARKETS.us, [marketId]);
  const isSuperadmin = currentUser?.id === 1;

  const getStoreLimitLabel = (maxStores) => (maxStores === -1 ? 'Unlimited stores' : `Up to ${maxStores} store${maxStores > 1 ? 's' : ''}`);

  const applyTierDirectly = async () => {
    if (!storeId || !selectedTier) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/stores/${storeId}/tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: selectedTier, payment_confirmed: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || 'Failed to update tier.');
        setLoading(false);
        return;
      }
      router.push('/admin/settings');
    } catch {
      setMessage('Network error while updating tier.');
      setLoading(false);
    }
  };

  const continueFlow = () => {
    if (!selectedTier || selectedTier === currentTier) return;
    if (isSuperadmin) {
      applyTierDirectly();
      return;
    }
    if (selectedTier === 'enterprise') {
      router.push('/contact');
      return;
    }
    const tier = TIERS[selectedTier];
    const basePrice = parseFloat((market.prices[selectedTier] || '0').toString().replace(/,/g, ''));
    router.push(`/checkout?tier=${selectedTier}&market=${market.id}&planName=${encodeURIComponent(tier.label)}&price=${basePrice}&storeId=${storeId}`);
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto min-h-screen">
      <div className="bg-theme-surface rounded-[2.5rem] border border-theme-border p-8 md:p-10 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-theme-text tracking-tight">Manage Node Tier</h1>
            <p className="text-sm font-medium text-theme-text-muted mt-1">
              Select the new tier for store <strong>{storeName}</strong>.
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/settings')}
            className="px-4 py-2 rounded-xl bg-theme-border text-theme-text font-bold text-sm hover:bg-slate-200 transition-all"
          >
            Back
          </button>
        </div>

        <div className="rounded-2xl border border-theme-border bg-theme-surface-container px-4 py-3 mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted">Current plan</p>
          <p className="text-base font-black text-theme-text mt-1">{TIERS[currentTier]?.label || 'Software Only'}</p>
        </div>

        <div className="space-y-3">
          {Object.entries(TIERS).map(([key, tier]) => {
            const isCurrent = currentTier === key;
            const isSelected = selectedTier === key;
            const isRecommended = currentTier === 'software_only' && key === 'hardware_bundle';
            const marketPrice = key === 'enterprise' ? 'Contact Sales' : `${market.currency}${market.prices[key] || '-'}/month`;

            return (
              <button
                key={key}
                onClick={() => setSelectedTier(key)}
                className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                    : 'border-theme-border bg-theme-surface hover:border-theme-text-muted/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={`material-symbols-outlined mt-0.5 ${isSelected ? 'text-emerald-500' : 'text-theme-text-muted'}`}>{tier.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-theme-text block">{tier.label}</span>
                        {isRecommended && (
                          <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Recommended</span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-theme-text-muted">{marketPrice}</span>
                    </div>
                  </div>
                  {isCurrent ? (
                    <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Active</span>
                  ) : isSelected ? (
                    <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Selected</span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">Select</span>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-theme-border bg-theme-surface-container px-3 py-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-muted">Stores</p>
                    <p className="text-xs font-bold text-theme-text mt-1">{getStoreLimitLabel(tier.maxStores)}</p>
                  </div>
                  <div className="rounded-xl border border-theme-border bg-theme-surface-container px-3 py-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-theme-text-muted">Support</p>
                    <p className="text-xs font-bold text-theme-text mt-1">{tier.support || 'Standard support'}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {message ? (
          <p className="mt-4 text-sm font-bold text-red-600">{message}</p>
        ) : null}

        <div className="mt-6">
          <button
            onClick={continueFlow}
            disabled={loading || !selectedTier || selectedTier === currentTier}
            className="w-full py-4 primary-gradient text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Please wait...'
              : selectedTier === 'enterprise'
                ? 'Continue to Contact Sales'
                : isSuperadmin
                  ? 'Apply Tier Change'
                  : 'Continue to Secure Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}
