'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import MarketingNavbar from '@/components/marketing/MarketingNavbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { Section } from '@/components/marketing/MarketingSection';

export default function ContactPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <MarketingNavbar />
      <Section
        eyebrow={t('contact_label')}
        title={t('contact_title')}
        description={t('contact_desc')}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">{t('get_started_today')}</h3>
            <p className="mt-3 text-sm text-slate-600">
              {t('contact_setup_desc')}
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/signup" className="rounded-full px-5 py-2 text-sm font-semibold text-white primary-gradient">
                {t('start_free_trial')}
              </Link>
              <Link href="/pricing" className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700">
                {t('view_pricing')}
              </Link>
            </div>
          </article>
          <article className="rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">{t('support_sales')}</h3>
            <p className="mt-3 text-sm text-slate-600">{t('migration_help_desc')}</p>
            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              <li>• {t('in_app_support')}</li>
              <li>• {t('priority_support_msg')}</li>
              <li>• {t('ops_onboarding_msg')}</li>
            </ul>
            <Link href="/support" className="mt-6 inline-flex rounded-full px-5 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
              {t('open_support')}
            </Link>
          </article>
        </div>
      </Section>
      <MarketingFooter />
    </div>
  );
}
