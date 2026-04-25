import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const storeId = auth.user.store_id;
    const today = new Date().toISOString().split('T')[0];

    const [
      todayOrdersRes,
      todayRevenueRes,
      pendingPickupRes,
      activeGarmentsRes,
      totalOrdersRes,
      totalCustomersRes,
      totalRevenueRes,
      recentOrdersRes,
      inventoryTotalRes,
      inventoryLowRes,
      lowStockItemsRes
    ] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM orders WHERE created_at::date = $1::date AND store_id = $2`, [today, storeId]),
      query(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE created_at::date = $1::date AND payment_status = 'paid' AND store_id = $2`, [today, storeId]),
      query(`SELECT COUNT(*) as count FROM orders WHERE status = 'ready' AND store_id = $1`, [storeId]),
      query(`SELECT COUNT(oi.*) as count FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.status NOT IN ('ready', 'delivered') AND o.store_id = $1`, [storeId]),
      query('SELECT COUNT(*) as count FROM orders WHERE store_id = $1', [storeId]),
      query('SELECT COUNT(*) as count FROM customers WHERE store_id = $1', [storeId]),
      query(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid' AND store_id = $1`, [storeId]),
      query(`
        SELECT o.*, c.name as customer_name, c.phone as customer_phone,
          (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.store_id = $1
        ORDER BY o.created_at DESC
        LIMIT 10
      `, [storeId]),
      query('SELECT COUNT(*) as count FROM inventory WHERE store_id = $1', [storeId]),
      query('SELECT COUNT(*) as count FROM inventory WHERE quantity <= reorder_level AND store_id = $1', [storeId]),
      query(`SELECT item_name FROM inventory WHERE quantity <= reorder_level AND store_id = $1 LIMIT 3`, [storeId])
    ]);

    const totalItems = parseInt(inventoryTotalRes.rows[0].count);
    const lowItems = parseInt(inventoryLowRes.rows[0].count);
    const stockHealth = totalItems > 0 ? Math.round(((totalItems - lowItems) / totalItems) * 100) : 100;

    return NextResponse.json({
      todayOrders: parseInt(todayOrdersRes.rows[0].count),
      todayRevenue: parseFloat(todayRevenueRes.rows[0].total),
      pendingPickup: parseInt(pendingPickupRes.rows[0].count),
      activeGarments: parseInt(activeGarmentsRes.rows[0].count),
      totalOrders: parseInt(totalOrdersRes.rows[0].count),
      totalCustomers: parseInt(totalCustomersRes.rows[0].count),
      totalRevenue: parseFloat(totalRevenueRes.rows[0].total),
      recentOrders: recentOrdersRes.rows,
      inventoryAlerts: lowItems,
      stockHealth,
      lowStockItems: lowStockItemsRes.rows.map(r => r.item_name).join(' & ') || 'All stocked',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
