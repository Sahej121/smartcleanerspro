import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';

export async function GET() {
  const start = Date.now();
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'down',
      razorpay: 'unknown',
    },
    latency: 0,
  };

  try {
    // Check DB
    await query('SELECT 1');
    status.services.database = 'up';
  } catch (err) {
    status.status = 'error';
    status.services.database = 'down';
  }

  // Razorpay check (simple key check)
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    status.services.razorpay = 'configured';
  }

  status.latency = Date.now() - start;

  return NextResponse.json(status, {
    status: status.status === 'ok' ? 200 : 503,
  });
}
