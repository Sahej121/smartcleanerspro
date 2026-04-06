import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !['owner', 'manager'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = session.store_id;

    // 1. Overall Summary
    const summaryRes = await query(`
      WITH cycle_times AS (
        SELECT 
          order_item_id,
          MIN(timestamp) FILTER (WHERE stage = 'received') as received_time,
          MAX(timestamp) FILTER (WHERE stage = 'ready') as ready_time
        FROM garment_workflow gw
        JOIN users u ON gw.updated_by = u.id
        WHERE u.store_id = $1 AND gw.timestamp > NOW() - INTERVAL '30 days'
        GROUP BY order_item_id
      )
      SELECT 
        (SELECT COUNT(DISTINCT order_item_id) FROM garment_workflow gw JOIN users u ON gw.updated_by = u.id WHERE u.store_id = $1 AND gw.timestamp > NOW() - INTERVAL '7 days') as total_items,
        (SELECT name FROM users WHERE id = (
          SELECT updated_by FROM garment_workflow gw 
          JOIN users u ON gw.updated_by = u.id 
          WHERE u.store_id = $1 AND gw.timestamp > NOW() - INTERVAL '7 days'
          GROUP BY updated_by 
          ORDER BY COUNT(*) DESC LIMIT 1
        )) as top_performer,
        (SELECT AVG(EXTRACT(EPOCH FROM (ready_time - received_time)) / 3600) FROM cycle_times WHERE received_time IS NOT NULL AND ready_time IS NOT NULL) as avg_hours
    `, [storeId]);

    const avgHours = parseFloat(summaryRes.rows[0]?.avg_hours || 0);
    const summary = {
      totalItems: parseInt(summaryRes.rows[0]?.total_items || 0),
      topPerformer: summaryRes.rows[0]?.top_performer || 'N/A',
      avgCycleTime: avgHours > 0 ? `${avgHours.toFixed(1)}h` : 'N/A',
    };

    // 2. Staff Stats (Last 7 days efficiency)
    const staffStatsRes = await query(`
      SELECT 
        u.id, 
        u.name, 
        u.role, 
        COUNT(gw.id) as actions_performed,
        COUNT(DISTINCT gw.order_item_id) as items_handled
      FROM users u
      LEFT JOIN garment_workflow gw ON u.id = gw.updated_by AND gw.timestamp > NOW() - INTERVAL '7 days'
      WHERE u.store_id = $1 AND u.role NOT IN ('owner', 'driver')
      GROUP BY u.id, u.name, u.role
      ORDER BY actions_performed DESC
    `, [storeId]);

    // 3. Daily Throughput (Last 7 days)
    const dailyThroughputRes = await query(`
      SELECT 
        DATE_TRUNC('day', gw.timestamp) as day,
        COUNT(gw.id) as actions
      FROM garment_workflow gw
      JOIN users u ON gw.updated_by = u.id
      WHERE u.store_id = $1 AND gw.timestamp > NOW() - INTERVAL '7 days'
      GROUP BY day
      ORDER BY day ASC
    `, [storeId]);

    // 4. Bottleneck Detection
    const bottlenecksRes = await query(`
      SELECT 
        oi.status as stage, 
        COUNT(*) as count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.store_id = $1 AND oi.status NOT IN ('delivered', 'ready', 'cancelled')
      GROUP BY oi.status
      ORDER BY count DESC
    `, [storeId]);

    return NextResponse.json({
      summary,
      staffStats: staffStatsRes.rows.map(r => {
        const actions = parseInt(r.actions_performed);
        // Target: 40 actions/day * 7 days = 280 actions/week
        const efficiency = Math.min(100, Math.round((actions / 280) * 100));
        return {
          ...r,
          efficiency: actions > 0 ? efficiency : 0
        };
      }),
      dailyThroughput: dailyThroughputRes.rows.map(r => ({
        day: new Date(r.day).toLocaleDateString('en-US', { weekday: 'short' }),
        count: parseInt(r.actions)
      })),
      bottlenecks: bottlenecksRes.rows
    });

  } catch (error) {
    console.error('[Analytics API Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
