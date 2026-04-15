'use client';

import MarketingNavbar from '@/components/marketing/MarketingNavbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { Section } from '@/components/marketing/MarketingSection';
import Link from 'next/link';

const featureBlocks = [
  {
    title: 'Order and POS Management',
    points: ['Fast intake and ticket generation', 'Customer history at checkout', 'Clear lifecycle statuses per garment'],
  },
  {
    title: 'Production Workflow',
    points: ['Stage-based operations queue', 'Machine and assembly tracking', 'Quality control and completion visibility'],
  },
  {
    title: 'Logistics and Delivery',
    points: ['Pickup and delivery assignments', 'Route-focused driver workflows', 'Photo/signature proof capture'],
  },
  {
    title: 'Analytics and Reporting',
    points: ['Staff performance views', 'Revenue and throughput summaries', 'Operational health monitoring'],
  },
  {
    title: 'Role and Tier Controls',
    points: ['Owner, manager, staff, driver roles', 'Tier-based route access controls', 'Secure middleware protections'],
  },
  {
    title: 'Multi-store Oversight',
    points: ['Centralized admin settings', 'Store-level branding and configs', 'Scalable operations from one console'],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <MarketingNavbar />
      <Section
        eyebrow="Features"
        title="Everything your atelier needs in one platform"
        description="DrycleanersFlow combines front desk speed, production discipline, logistics reliability, and executive visibility."
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featureBlocks.map((block) => (
            <article key={block.title} className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-black text-slate-900">{block.title}</h3>
              <ul className="mt-4 space-y-2">
                {block.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-0.5 text-emerald-600">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="mt-10 rounded-3xl border border-emerald-100 bg-white p-6 md:flex md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Ready To Launch</p>
            <p className="mt-2 text-sm text-slate-600">Start with core workflows now and scale to multi-store operations as you grow.</p>
          </div>
          <div className="mt-4 flex gap-3 md:mt-0">
            <Link href="/signup" className="rounded-full px-5 py-2 text-sm font-semibold text-white primary-gradient">
              Start Free Trial
            </Link>
            <Link href="/pricing" className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700">
              View Pricing
            </Link>
          </div>
        </div>
      </Section>
      <MarketingFooter />
    </div>
  );
}
