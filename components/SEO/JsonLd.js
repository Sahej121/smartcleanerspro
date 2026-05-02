import Script from 'next/script';

export default function JsonLd() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'DrycleanersFlow',
    'url': 'https://smartcleaners.pro',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': 'https://smartcleaners.pro/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'DrycleanersFlow',
    'operatingSystem': 'Web, iOS, Android',
    'applicationCategory': 'BusinessApplication',
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.9',
      'ratingCount': '128',
    },
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'DrycleanersFlow',
    'url': 'https://smartcleaners.pro',
    'logo': 'https://smartcleaners.pro/icons/logo-icon.svg',
    'sameAs': [
      'https://twitter.com/drycleanersflow',
      'https://linkedin.com/company/drycleanersflow',
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'What is DrycleanersFlow?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'DrycleanersFlow is an all-in-one POS and management platform designed specifically for premium dry cleaners, laundry networks, and garment care ateliers.',
        },
      },
      {
        '@type': 'Question',
        'name': 'Does it support multi-store management?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes, our platform is built for growth. You can manage multiple store locations, track cross-store inventory, and view consolidated reports from a single dashboard.',
        },
      },
    ],
  };

  return (
    <>
      <Script
        id="schema-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="schema-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <Script
        id="schema-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="schema-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
