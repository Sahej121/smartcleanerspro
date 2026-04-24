import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Execute all queries in parallel to minimize cross-region latency
    const [
      totalRevenue,
      todayRevenue,
      dailyRevenue,
      ordersByStatus,
      totalOrders,
      avgOrderValue,
      topServices,
      topGarments,
      avgTurnaround,
      staffCount,
      paymentMethods
    ] = await Promise.all([
      query(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid'`),
      query(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid' AND created_at::date = $1::date`, [today]),
      query(`
        SELECT created_at::date as day, COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as order_count
        FROM orders 
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY created_at::date
        ORDER BY day ASC
      `),
      query(`SELECT status, COUNT(*) as count FROM orders GROUP BY status`),
      query('SELECT COUNT(*) as count FROM orders'),
      query(`SELECT COALESCE(AVG(total_amount), 0) as avg FROM orders WHERE payment_status = 'paid'`),
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
        SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(delivery_date::timestamptz, NOW()) - created_at)) / 86400) as avg_days
        FROM orders WHERE status IN ('ready', 'delivered')
      `),
      query('SELECT COUNT(*) as count FROM users'),
      query(`
        SELECT payment_method, COUNT(*) as count, SUM(amount) as total
        FROM payments
        GROUP BY payment_method
      `)
    ]);

    const data = {
      totalRevenue: parseFloat(totalRevenue.rows[0].total),
      todayRevenue: parseFloat(todayRevenue.rows[0].total),
      dailyRevenue: dailyRevenue.rows,
      ordersByStatus: ordersByStatus.rows,
      totalOrders: parseInt(totalOrders.rows[0].count),
      avgOrderValue: Math.round(parseFloat(avgOrderValue.rows[0].avg)),
      topServices: topServices.rows,
      topGarments: topGarments.rows,
      avgTurnaround: avgTurnaround.rows[0].avg_days ? Math.round(parseFloat(avgTurnaround.rows[0].avg_days) * 10) / 10 : 0,
      staffCount: parseInt(staffCount.rows[0].count),
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
