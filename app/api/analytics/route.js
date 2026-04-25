import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Execute all queries in parallel to minimize cross-region latency
    const [
      metrics,
      dailyRevenue,
      ordersByStatus,
      topServices,
      topGarments,
      paymentMethods
    ] = await Promise.all([
      query(`
        SELECT 
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'paid') as total_revenue,
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'paid' AND created_at::date = $1::date) as today_revenue,
          (SELECT COUNT(*) FROM orders) as total_orders,
          (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE payment_status = 'paid') as avg_order_value,
          (SELECT COUNT(*) FROM users) as staff_count,
          (SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(delivery_date::timestamptz, NOW()) - created_at)) / 86400) FROM orders WHERE status IN ('ready', 'delivered')) as avg_turnaround
      `, [today]),
      query(`
        SELECT created_at::date as day, COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as order_count
        FROM orders 
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY created_at::date
        ORDER BY day ASC
      `),
      query(`SELECT status, COUNT(*) as count FROM orders GROUP BY status`),
      query(`
        SELECT service_type, COUNT(*) as count, SUM(price) as revenue
        FROM order_items
        GROUP BY service_type
        ORDER BY count DESC
        LIMIT 5
      `),
      query(`
        SELECT garment_type, COUNT(*) as count
        FROM order_items
        GROUP BY garment_type
        ORDER BY count DESC
        LIMIT 5
      `),
      query(`
        SELECT payment_method, COUNT(*) as count, SUM(amount) as total
        FROM payments
        GROUP BY payment_method
      `)
    ]);

    const m = metrics.rows[0];
    const data = {
      totalRevenue: parseFloat(m.total_revenue),
      todayRevenue: parseFloat(m.today_revenue),
      dailyRevenue: dailyRevenue.rows,
      ordersByStatus: ordersByStatus.rows,
      totalOrders: parseInt(m.total_orders),
      avgOrderValue: Math.round(parseFloat(m.avg_order_value)),
      topServices: topServices.rows,
      topGarments: topGarments.rows,
      avgTurnaround: m.avg_turnaround ? Math.round(parseFloat(m.avg_turnaround) * 10) / 10 : 0,
      staffCount: parseInt(m.staff_count),
      paymentMethods: paymentMethods.rows,
    };

    // Add Cache-Control header for better global performance (1 minute cache)
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
