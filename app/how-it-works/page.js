'use client';

import Link from 'next/link';
import Image from 'next/image';
import MarketingNavbar from '@/components/marketing/MarketingNavbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { Section } from '@/components/marketing/MarketingSection';

const workflowSteps = [
  {
    title: '1) Intake and Tagging',
    body: 'Create the order, capture garment details, and generate a unique QR label so every item is traceable from the first touchpoint.',
    image: '/images/website/how-it-works-1.png',
  },
  {
    title: '2) Stain Identification',
    body: 'Use guided stain analysis to classify garment issues and apply treatment recommendations before processing.',
    image: '/images/website/how-it-works-2.png',
  },
  {
    title: '3) Production Workflow',
    body: 'Move each item through sorting, cleaning, pressing, and quality checkpoints with clear stage-by-stage visibility.',
    image: '/images/website/how-it-works-3.png',
  },
  {
    title: '4) Delivery and Completion',
    body: 'Assign routes, track pickups and drop-offs, and capture signature/photo proof to close the order confidently.',
    image: '/images/website/how-it-works-1.png',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <MarketingNavbar />
      <Section
        eyebrow="How It Works"
        title="A complete garment lifecycle in one system"
        description="From counter intake to final delivery, DrycleanersFlow keeps your team synchronized with a clear, auditable workflow."
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
          <p className="text-sm text-slate-600">Ready to put this workflow in place for your business?</p>
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
