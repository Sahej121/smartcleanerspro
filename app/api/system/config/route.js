import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request) {
  // Static configuration that doesn't need database access
  // This can be used to hydrate UI elements instantly across the globe
  const config = {
    appName: "Dry Cleaner's flow",
    version: '2.1.0',
    supportEmail: 'support@smartcleanerspro.com',
    features: {
      ai_stain_analysis: true,
      real_time_tracking: true,
      multi_currency: true,
      enterprise_security: true
    },
    maintenance: false,
    environment: process.env.NODE_ENV,
    cdn_url: 'https://cdn.smartcleanerspro.com'
  };

  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
