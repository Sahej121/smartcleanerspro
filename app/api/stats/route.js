import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const storeId = auth.user.store_id;
    const today = new Date().toISOString().split('T')[0];

    const todayOrders = await query(
      `SELECT COUNT(*) as count FROM orders WHERE created_at::date = $1::date AND store_id = $2`,
      [today, storeId]
    );

    const todayRevenue = await query(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders 
       WHERE created_at::date = $1::date AND payment_status = 'paid' AND store_id = $2`,
      [today, storeId]
    );

    const pendingPickup = await query(
      `SELECT COUNT(*) as count FROM orders WHERE status = 'ready' AND store_id = $1`,
      [storeId]
    );

    const activeGarments = await query(
      `SELECT COUNT(oi.*) as count FROM order_items oi JOIN orders o ON oi.order_id = o.id 
       WHERE oi.status NOT IN ('ready', 'delivered') AND o.store_id = $1`,
      [storeId]
    );

    const totalOrders = await query('SELECT COUNT(*) as count FROM orders WHERE store_id = $1', [storeId]);
    const totalCustomers = await query('SELECT COUNT(*) as count FROM customers WHERE store_id = $1', [storeId]);
    const totalRevenue = await query(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid' AND store_id = $1`, [storeId]
    );

    const recentOrders = await query(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.store_id = $1
      ORDER BY o.created_at DESC
      LIMIT 10
    `, [storeId]);

    // Inventory stats for dashboard
    // Inventory stats for dashboard
    const inventoryTotal = await query('SELECT COUNT(*) as count FROM inventory WHERE store_id = $1', [storeId]);
    const inventoryLow = await query(
      'SELECT COUNT(*) as count FROM inventory WHERE quantity <= reorder_level AND store_id = $1', [storeId]
    );
    const lowStockItems = await query(
      `SELECT item_name FROM inventory WHERE quantity <= reorder_level AND store_id = $1 LIMIT 3`, [storeId]
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
