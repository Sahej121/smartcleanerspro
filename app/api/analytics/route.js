import { getDb } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getDb();

    // Revenue analytics
    const totalRevenue = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid'
    `).get();

    const today = new Date().toISOString().split('T')[0];
    const todayRevenue = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM orders 
      WHERE payment_status = 'paid' AND date(created_at) = date(?)
    `).get(today);

    // Last 7 days revenue
    const dailyRevenue = db.prepare(`
      SELECT date(created_at) as day, COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as order_count
      FROM orders 
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY date(created_at)
      ORDER BY day ASC
    `).all();

    // Order stats
    const ordersByStatus = db.prepare(`
      SELECT status, COUNT(*) as count FROM orders GROUP BY status
    `).all();

    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
    const avgOrderValue = db.prepare(`
      SELECT COALESCE(AVG(total_amount), 0) as avg FROM orders WHERE payment_status = 'paid'
    `).get();

    // Top services
    const topServices = db.prepare(`
      SELECT service_type, COUNT(*) as count, SUM(price) as revenue
      FROM order_items
      GROUP BY service_type
      ORDER BY count DESC
      LIMIT 5
    `).all();

    // Top garments
    const topGarments = db.prepare(`
      SELECT garment_type, COUNT(*) as count
      FROM order_items
      GROUP BY garment_type
      ORDER BY count DESC
      LIMIT 5
    `).all();

    // Turnaround (avg days between received and ready/delivered)
    const avgTurnaround = db.prepare(`
      SELECT AVG(julianday(COALESCE(delivery_date, datetime('now'))) - julianday(created_at)) as avg_days
      FROM orders WHERE status IN ('ready', 'delivered')
    `).get();

    // Staff count
    const staffCount = db.prepare('SELECT COUNT(*) as count FROM users').get();

    // Payment methods
    const paymentMethods = db.prepare(`
      SELECT payment_method, COUNT(*) as count, SUM(amount) as total
      FROM payments
      GROUP BY payment_method
    `).all();

    return NextResponse.json({
      totalRevenue: totalRevenue.total,
      todayRevenue: todayRevenue.total,
      dailyRevenue,
      ordersByStatus,
      totalOrders: totalOrders.count,
      avgOrderValue: Math.round(avgOrderValue.avg),
      topServices,
      topGarments,
      avgTurnaround: avgTurnaround.avg_days ? Math.round(avgTurnaround.avg_days * 10) / 10 : 0,
      staffCount: staffCount.count,
      paymentMethods,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
