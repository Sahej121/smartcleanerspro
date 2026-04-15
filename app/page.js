'use client';

import Link from 'next/link';
import { useUser, ROLES } from '@/lib/UserContext';
import StoreAdmin from '@/components/dashboards/StoreAdmin';
import MasterControl from '@/components/dashboards/MasterControl';
import StaffOperations from '@/components/dashboards/StaffOperations';
import BusinessOwner from '@/components/dashboards/BusinessOwner';
import MarketingNavbar from '@/components/marketing/MarketingNavbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { MetricCard, Section } from '@/components/marketing/MarketingSection';

export default function DashboardPage() {
  const { role, user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Initializing Pristine Atelier...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8faf9]">
        <MarketingNavbar />
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-emerald-700">Operational Clarity</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
              One system for orders, production, and logistics
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              DrycleanersFlow helps dry cleaners run front desk, machine workflow, and delivery teams in real time without scattered tools.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="rounded-full px-6 py-3 text-sm font-semibold text-white primary-gradient shadow-md shadow-emerald-900/20">
                Start Free Trial
              </Link>
              <Link href="/features" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Explore Features
              </Link>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard label="Orders Tracked" value="99.9%" note="End-to-end garment status visibility" />
            <MetricCard label="Role-based Access" value="4+" note="Owner, manager, staff, and driver workflows" />
            <MetricCard label="Store Operations" value="Multi-site" note="Centralized control for growing teams" />
            <MetricCard label="Delivery Proof" value="Live" note="Photo and signature capture built in" />
          </div>
        </section>

        <Section
          eyebrow="Platform"
          title="Built around real dry cleaner workflows"
          description="From intake to delivery, each stage is trackable with audit-ready updates."
        >
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { title: 'Front Of House', body: 'Quick order creation, customer records, and live status updates from the counter.' },
              { title: 'Back Of House', body: 'Production queue controls for sorting, washing, ironing, quality checks, and readiness.' },
              { title: 'Logistics Hub', body: 'Route tasks, assign drivers, and capture proof of delivery in one flow.' },
            ].map((item) => (
              <article key={item.title} className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-black text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>
        </Section>
        <MarketingFooter />
      </div>
    );
  }

  // Switch based on ROLES from UserContext
  if (role === ROLES.OWNER) {
    // id=1 is treated as SaaS "root owner" elsewhere (tier bypass, provisioning).
    // Other owners are dry-cleaning business owners and should see the operations dashboard.
    if (user?.id === 1) return <MasterControl user={user} />;
    return <BusinessOwner user={user} />;
  }

  if ([ROLES.STAFF, ROLES.FRONTDESK, ROLES.DRIVER].includes(role)) {
    return <StaffOperations user={user} />;
  }

  // Default to Store Admin (Managers or fallback)
  return <StoreAdmin user={user} />;
}
