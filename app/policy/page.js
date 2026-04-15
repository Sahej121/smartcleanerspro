'use client';

import MarketingNavbar from '@/components/marketing/MarketingNavbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { Section } from '@/components/marketing/MarketingSection';

const policySections = [
  {
    title: 'Privacy and Customer Data',
    points: [
      'Customer and order data is processed only for service delivery, communication, and operational reporting.',
      'Access is role-based so teams can only view the information needed for their responsibilities.',
      'Sensitive information is protected in transit and at rest through secure platform controls.',
    ],
  },
  {
    title: 'Operational and Payment Security',
    points: [
      'All operational actions are tracked to support accountability and audit readiness.',
      'Only authorized staff can modify pricing, billing, store settings, and critical workflow states.',
      'Billing and payment operations follow secure processing and verified access patterns.',
    ],
  },
  {
    title: 'Service Use and Responsibilities',
    points: [
      'Users are responsible for accurate order entry, customer details, and delivery confirmation records.',
      'Accounts must maintain strong credentials and immediately report unauthorized access.',
      'Use of the service must comply with applicable local laws and business regulations.',
    ],
  },
  {
    title: 'Support, Changes, and Contact',
    points: [
      'Policy updates may be published as the platform evolves and legal requirements change.',
      'Material changes are communicated through in-app notices or account communications.',
      'For privacy and policy questions, contact the support team through the in-app support channel.',
    ],
  },
];

export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <MarketingNavbar />
      <Section
        eyebrow="Policy"
        title="Trust, privacy, and service commitments"
        description="This page summarizes how DrycleanersFlow handles data, security, and platform usage standards for all customers."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {policySections.map((section) => (
            <article key={section.title} className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">{section.title}</h2>
              <ul className="mt-4 space-y-3">
                {section.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-0.5 text-emerald-600">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Policy Last Updated: April 15, 2026
        </div>
      </Section>
      <MarketingFooter />
    </div>
  );
}
