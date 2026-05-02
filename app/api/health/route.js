import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';
import { redis } from '@/lib/redis';
import { env } from '@/lib/env';

export async function GET() {
  const start = Date.now();
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'down',
      redis: 'down',
      inngest: env.INNGEST_EVENT_KEY ? 'configured' : 'missing',
      glitchtip: env.SENTRY_DSN ? 'configured' : 'missing',
      razorpay: (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) ? 'configured' : 'missing',
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

  try {
    // Check Redis
    await redis.set('health-check', 'ok', { ex: 10 });
    status.services.redis = 'up';
  } catch (err) {
    status.status = 'error';
    status.services.redis = 'down';
  }

  status.latency = Date.now() - start;

  return NextResponse.json(status, {
    status: status.status === 'ok' ? 200 : 503,
  });
}
