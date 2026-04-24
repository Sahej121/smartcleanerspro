import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';

export async function GET() {
  const start = Date.now();
  try {
    await query('SELECT 1');
    return NextResponse.json({
      ok: true,
      db: 'reachable',
      latency_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        db: 'unreachable',
        latency_ms: Date.now() - start,
        error: error?.message ?? String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

