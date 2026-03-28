import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const todayOrders = await query(
      `SELECT COUNT(*) as count FROM orders WHERE created_at::date = $1::date`,
      [today]
    );

    const todayRevenue = await query(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders 
       WHERE created_at::date = $1::date AND payment_status = 'paid'`,
      [today]
    );

    const pendingPickup = await query(
      `SELECT COUNT(*) as count FROM orders WHERE status = 'ready'`
    );

    const activeGarments = await query(
      `SELECT COUNT(*) as count FROM order_items 
       WHERE status NOT IN ('ready', 'delivered')`
    );

    const totalOrders = await query('SELECT COUNT(*) as count FROM orders');
    const totalCustomers = await query('SELECT COUNT(*) as count FROM customers');
    const totalRevenue = await query(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid'`
    );

    const recentOrders = await query(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    // Inventory stats for dashboard
    const inventoryTotal = await query('SELECT COUNT(*) as count FROM inventory');
    const inventoryLow = await query(
      'SELECT COUNT(*) as count FROM inventory WHERE quantity <= reorder_level'
    );
    const lowStockItems = await query(
      `SELECT item_name FROM inventory WHERE quantity <= reorder_level LIMIT 3`
    );

    const totalItems = parseInt(inventoryTotal.rows[0].count);
    const lowItems = parseInt(inventoryLow.rows[0].count);
    const stockHealth = totalItems > 0 ? Math.round(((totalItems - lowItems) / totalItems) * 100) : 100;

    return NextResponse.json({
      todayOrders: parseInt(todayOrders.rows[0].count),
      todayRevenue: parseFloat(todayRevenue.rows[0].total),
      pendingPickup: parseInt(pendingPickup.rows[0].count),
      activeGarments: parseInt(activeGarments.rows[0].count),
      totalOrders: parseInt(totalOrders.rows[0].count),
      totalCustomers: parseInt(totalCustomers.rows[0].count),
      totalRevenue: parseFloat(totalRevenue.rows[0].total),
      recentOrders: recentOrders.rows,
      inventoryAlerts: lowItems,
      stockHealth,
      lowStockItems: lowStockItems.rows.map(r => r.item_name).join(' & ') || 'All stocked',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
