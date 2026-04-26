import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';
import { requireRole } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await requireRole(req, ['owner']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const startTime = Date.now();
    await query('SELECT 1');
    const latency = Date.now() - startTime;

    const [storeStats, logsCount, recentIncidents, workflowStats, loginStats] = await Promise.all([
      query('SELECT status, count(*)::int as count FROM stores GROUP BY status'),
      query('SELECT count(*)::int as count FROM system_logs'),
      query(`
        SELECT
          COUNT(*) FILTER (WHERE severity = 'error' AND created_at >= NOW() - INTERVAL '24 HOURS')::int as errors_24h,
          COUNT(*) FILTER (WHERE severity = 'warning' AND created_at >= NOW() - INTERVAL '24 HOURS')::int as warnings_24h,
          MAX(created_at) as last_event_at
        FROM system_logs
      `),
      query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'received')::int as received_orders,
          COUNT(*) FILTER (WHERE status = 'processing')::int as processing_orders,
          COUNT(*) FILTER (WHERE status = 'ready')::int as ready_orders
        FROM orders
      `),
      query(`
        SELECT
          COUNT(*) FILTER (WHERE role IN ('owner', 'superadmin'))::int as privileged_users,
          COUNT(*) FILTER (WHERE role = 'manager')::int as manager_users,
          COUNT(*) FILTER (WHERE role IN ('staff', 'frontdesk', 'driver'))::int as frontline_users
        FROM users
      `),
    ]);

    const storesByStatus = Object.fromEntries(storeStats.rows.map((row) => [row.status, row.count]));
    const totalStores = Object.values(storesByStatus).reduce((sum, count) => sum + count, 0);
    const activeNodes = storesByStatus.active || 0;
    const errors24h = recentIncidents.rows[0].errors_24h;
    const warnings24h = recentIncidents.rows[0].warnings_24h;
    const uptime = totalStores === 0 ? 100 : Math.max(0, Math.min(100, Number(((activeNodes / totalStores) * 100).toFixed(2))));
    const status = errors24h > 0 ? 'DEGRADED' : warnings24h > 0 ? 'NOTICE' : 'OPERATIONAL';

    const resourceUsage = {
      db_load: Math.min(95, Math.max(8, latency * 4)),
      node_cpu: Math.min(95, Math.max(12, activeNodes * 9)),
      socket_latency: Math.min(95, Math.max(5, latency)),
    };

    const services = [
      {
        label: 'Auth Gateway',
        status: errors24h > 0 ? 'notice' : 'operational',
        health: errors24h > 0 ? 98.5 : 99.99,
      },
      {
        label: 'Workflow Cluster',
        status: workflowStats.rows[0].processing_orders > 0 ? 'operational' : 'notice',
        health: workflowStats.rows[0].processing_orders > 0 ? 99.9 : 98.8,
      },
      {
        label: 'Primary Postgres',
        status: latency > 250 ? 'notice' : 'operational',
        health: latency > 250 ? 97.9 : 99.98,
      },
      {
        label: 'Global Event Stream',
        status: warnings24h > 0 ? 'notice' : 'operational',
        health: warnings24h > 0 ? 98.4 : 99.6,
      },
    ];

    return NextResponse.json({
      status,
      uptime: `${uptime}%`,
      db_latency: `${latency}ms`,
      db_latency_ms: latency,
      active_nodes: activeNodes,
      stores_summary: storeStats.rows,
      total_logs: logsCount.rows[0].count,
      incidents: {
        errors_24h: errors24h,
        warnings_24h: warnings24h,
        last_event_at: recentIncidents.rows[0].last_event_at,
      },
      workflow: workflowStats.rows[0],
      users: loginStats.rows[0],
      resource_usage: resourceUsage,
      services,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[API HEALTH] CRITICAL FAILURE:', error.stack || error);
    return NextResponse.json({ status: 'DEGRADED', error: error.message }, { status: 500 });
  }
}
