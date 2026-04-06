'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PLANS = [
  {
    name: 'Starter',
    price: '$29',
    description: 'Perfect for small boutiques or new shops.',
    features: [
      'Basic POS & Invoicing',
      'Customer Management (CRM)',
      'Basic Order Tracking',
      'Single User Access',
      'Standard Support'
    ],
    buttonText: 'Current Plan',
    isCurrent: true,
    highlight: false
  },
  {
    name: 'Professional',
    price: '$99',
    description: 'The standard for high-growth dry cleaning facilities.',
    features: [
      'Everything in Starter',
      'Garment Assembly Control Room',
      'Scan-to-Advance Workflow',
      'Bottleneck Detection Alerts',
      'Multi-station Multi-user Support',
      'Priority Email Support'
    ],
    buttonText: 'Upgrade to Pro',
    isCurrent: false,
    highlight: true,
    promo: 'Most Popular'
  },
  {
    name: 'Enterprise',
    price: '$249',
    description: 'Complete production floor automation for large chains.',
    features: [
      'Everything in Professional',
      'Multi-Store Consolidated Dashboard',
      'Custom API & Integrations',
      'Worker Performance Analytics',
      'White-label Customer Portal',
      'Dedicated Account Manager'
    ],
    buttonText: 'Contact Sales',
    isCurrent: false,
    highlight: false
  }
];

export default function BillingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-theme-text p-6 lg:p-12 selection:bg-emerald-500/30 font-sans">
      <div className="max-w-6xl mx-auto space-y-12 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-theme-border pb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-4xl text-emerald-500 bg-emerald-500/10 p-3 rounded-[1.5rem] border border-emerald-500/20">workspaces</span>
              <h1 className="text-4xl font-black text-theme-text tracking-tighter">Subscription & Plans</h1>
            </div>
            <p className="text-theme-text-muted font-bold ml-1">Power up your production floor with premium tools.</p>
          </div>
          <div className="flex items-center gap-4 bg-surface p-2 rounded-[2rem] shadow-sm border border-theme-border">
            <button className="px-6 py-3 bg-slate-800 text-theme-text rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-md border border-slate-700">Monthly</button>
            <button className="px-6 py-3 text-theme-text-muted rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 hover:text-theme-text transition-colors">Yearly (Save 20%)</button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div 
              key={plan.name}
              className={`relative flex flex-col p-10 rounded-[3rem] transition-all duration-500 hover:-translate-y-2 ${
                plan.highlight 
                  ? 'bg-surface border border-emerald-500/50 text-theme-text shadow-[0_32px_64px_-16px_rgba(16,185,129,0.15)] ring-4 ring-emerald-500/10' 
                  : 'bg-surface text-theme-text shadow-xl border border-theme-border hover:border-slate-700'
              }`}
            >
              {plan.promo && (
                <div className="absolute top-0 right-8 -translate-y-1/2 px-4 py-1.5 bg-emerald-500 text-theme-text text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse">
                  {plan.promo}
                </div>
              )}

              <div className="mb-10">
                <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 ${plan.highlight ? 'text-emerald-500' : 'text-theme-text-muted'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={`text-6xl font-black tracking-tighter ${plan.highlight ? 'text-theme-text' : 'text-theme-text'}`}>{plan.price}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${plan.highlight ? 'text-emerald-500/70' : 'text-slate-600'}`}>/month</span>
                </div>
                <p className={`text-sm font-medium leading-relaxed mt-4 ${plan.highlight ? 'text-slate-400' : 'text-theme-text-muted'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="flex-1 space-y-5 mb-10">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className={`material-symbols-outlined text-[20px] ${plan.highlight ? 'text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'text-slate-600'}`}>check_circle</span>
                    <span className={`text-xs font-bold ${plan.highlight ? 'text-theme-text' : 'text-slate-400'}`}>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={plan.isCurrent}
                onClick={() => !plan.isCurrent && router.push('/operations/assembly')} // Success simulation
                className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 active:scale-95 ${
                  plan.isCurrent
                    ? 'bg-background text-slate-600 border border-theme-border cursor-default'
                    : plan.highlight
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-theme-text shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                      : 'bg-slate-800 border border-slate-700 hover:bg-slate-700 text-theme-text'
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Teaser */}
        <div className="p-12 md:p-16 bg-surface border border-emerald-500/20 rounded-[3rem] text-center space-y-6 relative overflow-hidden group shadow-[0_0_50px_rgba(16,185,129,0.05)] mt-12 block">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[90px] rounded-full translate-x-1/2 -translate-y-1/2 transition-transform duration-1000 group-hover:scale-150 pointer-events-none"></div>
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-theme-text tracking-tighter flex justify-center items-center gap-3">
              Looking for a custom solution?
              <span className="material-symbols-outlined text-emerald-500 text-4xl">rocket_launch</span>
            </h2>
            <p className="text-slate-400 font-bold text-sm max-w-xl mx-auto leading-relaxed">
              Our enterprise team can build specialized workflows, multiple facility views, and custom hardware integrations for your large-scale operations.
            </p>
            <button className="inline-flex items-center gap-3 px-8 py-5 bg-white text-emerald-950 hover:bg-slate-100 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] transition-transform shadow-lg">
              Contact Sales Architect
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
