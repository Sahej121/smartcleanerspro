import PricingContent from './PricingContent';

export const metadata = {
  title: 'Pricing & Plans | POS for Modern Dry Cleaners',
  description: 'Flexible pricing plans for dry cleaners of all sizes. From software-only tiers to full hardware bundles with thermal printers and automated tag systems.',
  openGraph: {
    title: 'Pricing & Plans | DrycleanersFlow',
    description: 'Transparent global pricing for the premium dry cleaning POS platform.',
  }
};

export default function Page() {
  return <PricingContent />;
}
