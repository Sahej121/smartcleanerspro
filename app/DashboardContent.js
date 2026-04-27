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
import { useLanguage } from '@/lib/i18n/LanguageContext';

import ROIEstimator from '@/components/marketing/ROIEstimator';
import DashboardPreview from '@/components/marketing/DashboardPreview';

export default function DashboardContent() {
  const { role, user, loading } = useUser();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-white/50 backdrop-blur-md">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
        </div>
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs animate-pulse">
          {t('init_system')}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen mesh-background selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
        {/* Animated Background Orbs */}
        <div className="glass-orb w-[600px] h-[600px] bg-emerald-400/20 -top-48 -left-48" />
        <div className="glass-orb w-[800px] h-[800px] bg-teal-300/10 top-1/2 -right-48" />
        <div className="glass-orb w-[400px] h-[400px] bg-blue-400/10 bottom-0 left-1/4" />

        <MarketingNavbar />
        
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-24">
          <div className="mx-auto max-w-7xl px-8 lg:px-12">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-32">
              <div className="reveal reveal-up relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 mb-8 shadow-sm">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    {t('landing_eyebrow')}
                  </span>
                </div>
                
                <h1 className="text-6xl font-black tracking-tighter text-slate-900 md:text-8xl lg:text-9xl mb-10 leading-[1.1] md:leading-[1.15] font-outfit">
                  {t('landing_title').split(' ').map((word, i) => {
                    const isHighlight = i > 4;
                    return (
                      <span key={i} className={isHighlight ? "text-gradient-emerald block" : "block"}>
                        {word}{' '}
                      </span>
                    );
                  })}
                </h1>
                
                <p className="max-w-xl text-xl md:text-2xl text-slate-600 leading-relaxed font-medium mb-12 opacity-90">
                  {t('landing_description')}
                </p>
                
                <div className="flex flex-wrap gap-5">
                  <Link href="/pricing" className="rounded-[1.25rem] px-10 py-5 text-sm font-black text-white primary-gradient shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all duration-300 shimmer-button">
                    {t('start_trial')}
                  </Link>
                  <Link href="/features" className="rounded-[1.25rem] border-2 border-slate-200 bg-white/60 backdrop-blur-xl px-10 py-5 text-sm font-black text-slate-700 hover:bg-white hover:border-emerald-200 transition-all duration-300">
                    {t('explore_features')}
                  </Link>
                </div>
              </div>

              <div className="reveal reveal-up delay-300 relative z-10 lg:pl-0">
                <DashboardPreview />
              </div>
            </div>
          </div>
        </section>

        {/* Logo Cloud (Trust Bar) */}
        <div className="border-y border-slate-200/50 bg-white/30 backdrop-blur-sm py-16 overflow-hidden">
          <div className="mx-auto max-w-7xl px-6">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-12">
              Trusted by the world's most prestigious ateliers & laundry networks
            </p>
            <div className="relative">
              <div className="logo-scroll-container flex items-center gap-24 md:gap-48 opacity-30 grayscale hover:grayscale-0 hover:opacity-60 transition-all duration-700">
                {[
                  'Vogue', 'LuxeClean', 'EliteGarment', 'TailoredCare', 'ModernWash',
                  'Vogue', 'LuxeClean', 'EliteGarment', 'TailoredCare', 'ModernWash' // Duplicated for seamless loop
                ].map((brand, i) => (
                  <div key={`${brand}-${i}`} className="text-3xl font-black tracking-tighter text-slate-900 cursor-default font-outfit uppercase">
                    {brand}
                  </div>
                ))}
              </div>
              {/* Fade masks */}
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <section className="py-24 mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="reveal reveal-up"><MetricCard label={t('metric_orders_label')} value="99.9%" note={t('metric_orders_note')} icon="task_alt" /></div>
            <div className="reveal reveal-up delay-100"><MetricCard label={t('metric_roles_label')} value="4+" note={t('metric_roles_note')} icon="badge" /></div>
            <div className="reveal reveal-up delay-200"><MetricCard label={t('metric_stores_label')} value="Multi" note={t('metric_stores_note')} icon="store" /></div>
            <div className="reveal reveal-up delay-300"><MetricCard label={t('metric_delivery_label')} value="Live" note={t('metric_delivery_note')} icon="local_shipping" /></div>
          </div>
        </section>

        {/* Features Section */}
        <Section
          eyebrow={t('platform_eyebrow')}
          title={t('platform_title')}
          description={t('platform_description')}
          className="relative overflow-visible"
        >
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { title: t('foh_title'), body: t('foh_desc'), icon: 'point_of_sale', color: 'bg-blue-50 text-blue-600', delay: '' },
              { title: t('boh_title'), body: t('boh_desc'), icon: 'inventory_2', color: 'bg-emerald-50 text-emerald-600', delay: 'delay-200' },
              { title: t('logistics_title'), body: t('logistics_desc'), icon: 'route', color: 'bg-purple-50 text-purple-600', delay: 'delay-400' },
            ].map((item) => (
              <article key={item.title} className={`reveal reveal-up ${item.delay} glass-card-matte p-10 rounded-[3rem] group hover:-translate-y-2 transition-transform duration-500`}>
                <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:rotate-6 transition-transform`}>
                  <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">{item.body}</p>
              </article>
            ))}
          </div>
        </Section>

        {/* ROI Estimator Section */}
        <Section
          title="Potential Savings"
          description="Switching to an automated platform isn't just about efficiency—it's about profitable growth."
          className="pb-0"
        >
          <ROIEstimator />
        </Section>

        {/* Call to Action */}
        <section className="mx-auto max-w-7xl px-6 py-32">
          <div className="primary-gradient rounded-[4rem] p-16 md:p-32 text-center relative overflow-hidden group shadow-[0_32px_128px_-16px_rgba(16,185,129,0.4)]">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <div className="relative reveal reveal-up">
              <h2 className="text-5xl md:text-8xl font-black text-white mb-10 tracking-tighter leading-[0.9]">
                Ready to transform <br className="hidden md:block" /> your atelier?
              </h2>
              <div className="flex flex-wrap justify-center gap-6">
                <Link href="/pricing" className="rounded-2xl bg-white px-12 py-6 text-sm font-black text-emerald-600 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300">
                  Get Started for Free
                </Link>
                <Link href="/contact" className="rounded-2xl border-2 border-white/30 bg-white/10 backdrop-blur-xl px-12 py-6 text-sm font-black text-white hover:bg-white/20 transition-all duration-300">
                  Talk to Sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        <MarketingFooter />
      </div>
    );
  }

  // Dashboard redirects for logged-in users
  if (role === ROLES.SUPERADMIN || user?.email === 'sehajbudhiraja2000@gmail.com') {
    return <MasterControl user={user} />;
  }

  if (role === ROLES.OWNER) {
    return <BusinessOwner user={user} />;
  }

  if ([ROLES.STAFF, ROLES.FRONTDESK, ROLES.DRIVER].includes(role)) {
    return <StaffOperations user={user} />;
  }

  return <StoreAdmin user={user} />;
}
