'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import MarketingNavbar from '@/components/marketing/MarketingNavbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { Section } from '@/components/marketing/MarketingSection';


export default function HowItWorksPage() {
  const { t } = useLanguage();

  const workflowSteps = [
    {
      title: t('workflow_step_1_title'),
      body: t('workflow_step_1_body'),
      image: '/images/website/how-it-works-1.png',
    },
    {
      title: t('workflow_step_2_title'),
      body: t('workflow_step_2_body'),
      image: '/images/website/how-it-works-2.png',
    },
    {
      title: t('workflow_step_3_title'),
      body: t('workflow_step_3_body'),
      image: '/images/website/how-it-works-3.png',
    },
    {
      title: t('workflow_step_4_title'),
      body: t('workflow_step_4_body'),
      image: '/images/website/how-it-works-1.png',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <MarketingNavbar />
      <Section
        eyebrow={t('how_it_works_label')}
        title={t('how_it_works_title')}
        description={t('how_it_works_desc')}
      >
        <div className="grid gap-6 md:grid-cols-2">
          {workflowSteps.map((step) => (
            <article key={step.title} className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
              <div className="relative h-52 w-full">
                <Image src={step.image} alt={step.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-black text-slate-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.body}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-10 rounded-3xl border border-emerald-100 bg-white p-6 md:flex md:items-center md:justify-between">
          <p className="text-sm text-slate-600">{t('ready_launch_query')}</p>
          <div className="mt-4 flex gap-3 md:mt-0">
            <Link href="/signup" className="rounded-full px-5 py-2 text-sm font-semibold text-white primary-gradient">
              {t('start_free_trial')}
            </Link>
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
