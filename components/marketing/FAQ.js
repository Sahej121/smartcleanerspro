'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function FAQ() {
  const { t } = useLanguage();

  const faqs = [
    {
      q: 'What is DrycleanersFlow?',
      a: 'DrycleanersFlow is an all-in-one POS and management platform designed specifically for premium dry cleaners, laundry networks, and garment care ateliers. It streamlines orders, production, and logistics.',
    },
    {
      q: 'Does it support multi-store management?',
      a: 'Yes, our platform is built for growth. You can manage multiple store locations, track cross-store inventory, and view consolidated reports from a single dashboard.',
    },
    {
      q: 'Is there an offline mode?',
      a: 'Absolutely. We understand that internet connectivity can be unstable. DrycleanersFlow includes a robust offline sync system that ensures your business never stops.',
    },
    {
      q: 'How does the automated outreach work?',
      a: 'The platform automatically sends personalized updates to your B2B and B2C clients via email and WhatsApp, keeping them informed about their garment status.',
    },
  ];

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {faqs.map((faq, i) => (
        <div key={i} className="glass-card-matte p-10 rounded-[3rem]">
          <h3 className="text-xl font-black text-slate-900 mb-4">{faq.q}</h3>
          <p className="text-slate-600 leading-relaxed font-medium">{faq.a}</p>
        </div>
      ))}
    </div>
  );
}
