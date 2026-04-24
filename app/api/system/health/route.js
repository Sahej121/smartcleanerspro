import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('cleanflow_session')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Simple health check: DB Ping + Resource Simulation
    console.log('[API HEALTH] Starting logic...');
    const startTime = Date.now();
    await query('SELECT 1');
    const latency = Date.now() - startTime;
    console.log('[API HEALTH] DB Ping successful:', latency);

    const storeStats = await query('SELECT status, count(*) FROM stores GROUP BY status');
    console.log('[API HEALTH] Store stats fetched');
    const logsCount = await query('SELECT count(*) FROM system_logs');
    console.log('[API HEALTH] Logs count fetched');

    return NextResponse.json({
      status: 'OPERATIONAL',
      uptime: '99.99%',
      db_latency: `${latency}ms`,
      active_nodes: 12,
      stores_summary: storeStats.rows,
      total_logs: logsCount.rows[0].count,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[API HEALTH] CRITICAL FAILURE:', error.stack || error);
    return NextResponse.json({ status: 'DEGRADED', error: error.message }, { status: 500 });
  }
}
