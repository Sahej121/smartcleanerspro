import { getDb } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getDb();

    const today = new Date().toISOString().split('T')[0];

    const todayOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders 
      WHERE date(created_at) = date(?)
    `).get(today);

    const todayRevenue = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM orders 
      WHERE date(created_at) = date(?) AND payment_status = 'paid'
    `).get(today);

    const pendingPickup = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE status = 'ready'
    `).get();

    const activeGarments = db.prepare(`
      SELECT COUNT(*) as count FROM order_items 
      WHERE status NOT IN ('ready', 'delivered')
    `).get();

    const totalOrders = db.prepare(`SELECT COUNT(*) as count FROM orders`).get();
    const totalCustomers = db.prepare(`SELECT COUNT(*) as count FROM customers`).get();
    const totalRevenue = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid'
    `).get();

    const recentOrders = db.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `).all();

    return NextResponse.json({
      todayOrders: todayOrders.count,
      todayRevenue: todayRevenue.total,
      pendingPickup: pendingPickup.count,
      activeGarments: activeGarments.count,
      totalOrders: totalOrders.count,
      totalCustomers: totalCustomers.count,
      totalRevenue: totalRevenue.total,
      recentOrders,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
