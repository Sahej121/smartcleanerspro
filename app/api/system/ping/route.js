import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request) {
  const { geo } = request;
  
  return NextResponse.json({
    status: 'OPERATIONAL',
    timestamp: new Date().toISOString(),
    region: geo?.region || 'unknown',
    city: geo?.city || 'unknown',
    country: geo?.country || 'unknown',
    latency_optimized: true,
    runtime: 'Vercel Edge'
  });
}
