import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Revenue analytics
    const totalRevenue = await query(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid'`
    );

    const today = new Date().toISOString().split('T')[0];
    const todayRevenue = await query(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders 
       WHERE payment_status = 'paid' AND created_at::date = $1::date`,
      [today]
    );

    // Last 7 days revenue
    const dailyRevenue = await query(`
      SELECT created_at::date as day, COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as order_count
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY created_at::date
      ORDER BY day ASC
    `);

    // Order stats
    const ordersByStatus = await query(
      `SELECT status, COUNT(*) as count FROM orders GROUP BY status`
    );

    const totalOrders = await query('SELECT COUNT(*) as count FROM orders');
    const avgOrderValue = await query(
      `SELECT COALESCE(AVG(total_amount), 0) as avg FROM orders WHERE payment_status = 'paid'`
    );

    // Top services
    const topServices = await query(`
      SELECT service_type, COUNT(*) as count, SUM(price) as revenue
      FROM order_items
      GROUP BY service_type
      ORDER BY count DESC
      LIMIT 5
    `);

    // Top garments
    const topGarments = await query(`
      SELECT garment_type, COUNT(*) as count
      FROM order_items
      GROUP BY garment_type
      ORDER BY count DESC
      LIMIT 5
    `);

    // Turnaround (avg days between received and ready/delivered)
    const avgTurnaround = await query(`
      SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(delivery_date::timestamptz, NOW()) - created_at)) / 86400) as avg_days
      FROM orders WHERE status IN ('ready', 'delivered')
    `);

    // Staff count
    const staffCount = await query('SELECT COUNT(*) as count FROM users');

    // Payment methods
    const paymentMethods = await query(`
      SELECT payment_method, COUNT(*) as count, SUM(amount) as total
      FROM payments
      GROUP BY payment_method
    `);

    return NextResponse.json({
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
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
