'use client';

import MarketingNavbar from '@/components/marketing/MarketingNavbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { Section } from '@/components/marketing/MarketingSection';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function FeaturesContent() {
  const { t } = useLanguage();

  const featureBlocks = [
    {
      title: t('feature_pos_title'),
      points: [t('feature_pos_p1'), t('feature_pos_p2'), t('feature_pos_p3')],
    },
    {
      title: t('feature_production_title'),
      points: [t('feature_production_p1'), t('feature_production_p2'), t('feature_production_p3')],
    },
    {
      title: t('feature_logistics_title'),
      points: [t('feature_logistics_p1'), t('feature_logistics_p2'), t('feature_logistics_p3')],
    },
    {
      title: t('feature_analytics_title'),
      points: [t('feature_analytics_p1'), t('feature_analytics_p2'), t('feature_analytics_p3')],
    },
    {
      title: t('feature_roles_title'),
      points: [t('feature_roles_p1'), t('feature_roles_p2'), t('feature_roles_p3')],
    },
    {
      title: t('feature_multistore_title'),
      points: [t('feature_multistore_p1'), t('feature_multistore_p2'), t('feature_multistore_p3')],
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <MarketingNavbar />
      <Section
        eyebrow={t('features_label')}
        title={t('features_title')}
        TitleTag="h1"
        description={t('features_desc')}
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
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">{t('ready_to_launch_label')}</p>
            <p className="mt-2 text-sm text-slate-600">{t('ready_to_launch_desc')}</p>
          </div>
          <div className="mt-4 flex gap-3 md:mt-0">
            <Link href="/pricing" className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700">
              {t('view_pricing')}
            </Link>
          </div>
        </div>
      </Section>
      <MarketingFooter />
    </div>
  );
}
