'use client';

import Link from 'next/link';
import MarketingNavbar from '@/components/marketing/MarketingNavbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { Section } from '@/components/marketing/MarketingSection';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <MarketingNavbar />
      <Section
        eyebrow="Contact"
        title="Talk to the DrycleanersFlow team"
        description="Share your store setup and we will help you pick the right workflow, roles, and tier."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Get Started Today</h3>
            <p className="mt-3 text-sm text-slate-600">
              Launch your workspace in minutes and configure operations for front desk, production, and logistics.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/signup" className="rounded-full px-5 py-2 text-sm font-semibold text-white primary-gradient">
                Start Free Trial
              </Link>
              <Link href="/pricing" className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700">
                View Pricing
              </Link>
            </div>
          </article>
          <article className="rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Support and Sales</h3>
            <p className="mt-3 text-sm text-slate-600">Need help with migration or operations design? Reach us through the app support flow.</p>
            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              <li>• In-app support center: `/support`</li>
              <li>• Priority support on higher tiers</li>
              <li>• Operations onboarding available</li>
            </ul>
            <Link href="/support" className="mt-6 inline-flex rounded-full px-5 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
              Open Support
            </Link>
          </article>
        </div>
      </Section>
      <MarketingFooter />
    </div>
  );
}
