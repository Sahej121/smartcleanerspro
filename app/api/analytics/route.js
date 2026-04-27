import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const storeId = auth.user.store_id;
    const today = new Date().toISOString().split('T')[0];

    // Consolidated queries into 2 groups to reduce round-trips
    const [mainMetrics, aggregates] = await Promise.all([
      query(`
        SELECT 
          json_build_object(
            'total_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'paid' AND store_id = $2),
            'today_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'paid' AND created_at::date = $1::date AND store_id = $2),
            'total_orders', (SELECT COUNT(*) FROM orders WHERE store_id = $2),
            'avg_order_value', (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE payment_status = 'paid' AND store_id = $2),
            'avg_turnaround', (SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(delivery_date::timestamptz, NOW()) - created_at)) / 86400) FROM orders WHERE status IN ('ready', 'delivered') AND store_id = $2)
          ) as metrics,
          (
            SELECT json_agg(d) FROM (
              SELECT created_at::date as day, COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as order_count
              FROM orders 
              WHERE created_at >= NOW() - INTERVAL '7 days' AND store_id = $2
              GROUP BY created_at::date
              ORDER BY day ASC
            ) d
          ) as daily_revenue,
          (SELECT json_agg(s) FROM (SELECT status, COUNT(*) as count FROM orders WHERE store_id = $2 GROUP BY status) s) as orders_by_status
      `, [today, storeId]),
      query(`
        SELECT 
          (
            SELECT json_agg(ts) FROM (
              SELECT service_type, COUNT(*) as count, SUM(price) as revenue
              FROM order_items oi JOIN orders o ON oi.order_id = o.id
              WHERE o.store_id = $1
              GROUP BY service_type ORDER BY count DESC LIMIT 5
            ) ts
          ) as top_services,
          (
            SELECT json_agg(tg) FROM (
              SELECT garment_type, COUNT(*) as count
              FROM order_items oi JOIN orders o ON oi.order_id = o.id
              WHERE o.store_id = $1
              GROUP BY garment_type ORDER BY count DESC LIMIT 5
            ) tg
          ) as top_garments,
          (
            SELECT json_agg(pm) FROM (
              SELECT payment_method, COUNT(*) as count, SUM(amount) as total
              FROM payments p JOIN orders o ON p.order_id = o.id
              WHERE o.store_id = $1
              GROUP BY payment_method
            ) pm
          ) as payment_methods,
          (SELECT COUNT(*) FROM users WHERE store_id = $1) as staff_count
      `, [storeId])
    ]);

    const m = mainMetrics.rows[0].metrics;
    const agg = aggregates.rows[0];

    const data = {
      totalRevenue: parseFloat(m.total_revenue),
      todayRevenue: parseFloat(m.today_revenue),
      dailyRevenue: mainMetrics.rows[0].daily_revenue || [],
      ordersByStatus: mainMetrics.rows[0].orders_by_status || [],
      totalOrders: parseInt(m.total_orders),
      avgOrderValue: Math.round(parseFloat(m.avg_order_value)),
      topServices: agg.top_services || [],
      topGarments: agg.top_garments || [],
      avgTurnaround: m.avg_turnaround ? Math.round(parseFloat(m.avg_turnaround) * 10) / 10 : 0,
      staffCount: parseInt(agg.staff_count),
      paymentMethods: agg.payment_methods || [],
    };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
