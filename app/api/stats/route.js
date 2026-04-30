import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const storeId = auth.user.store_id;
    const today = new Date().toISOString().split('T')[0];

    const [metricsRes, recentOrdersRes, lowStockRes, busiestDayRes] = await Promise.all([
      query(`
        WITH stats AS (
          SELECT 
            COUNT(*) FILTER (WHERE created_at::date = $1::date) as today_orders,
            COALESCE(SUM(total_amount) FILTER (WHERE created_at::date = $1::date AND payment_status = 'paid'), 0) as today_revenue,
            COUNT(*) FILTER (WHERE status = 'ready') as pending_pickup,
            COUNT(*) as total_orders,
            COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid'), 0) as total_revenue
          FROM orders 
          WHERE store_id = $2
        ),
        active_items AS (
          SELECT COUNT(*) as active_garments_count 
          FROM order_items oi 
          JOIN orders o ON oi.order_id = o.id 
          WHERE oi.status NOT IN ('ready', 'delivered') AND o.store_id = $2
        ),
        cust_stats AS (
          SELECT COUNT(*) as total_customers_count FROM customers WHERE store_id = $2
        ),
        inv_stats AS (
          SELECT 
            COUNT(*) as total_items,
            COUNT(*) FILTER (WHERE quantity <= reorder_level) as low_items
          FROM inventory 
          WHERE store_id = $2
        )
        SELECT * FROM stats, active_items, cust_stats, inv_stats
      `, [today, storeId]),
      query(`
        SELECT o.*, c.name as customer_name, c.phone as customer_phone,
          (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.store_id = $1
        ORDER BY o.created_at DESC
        LIMIT 10
      `, [storeId]),
      query(`SELECT item_name FROM inventory WHERE quantity <= reorder_level AND store_id = $1 LIMIT 3`, [storeId]),
      query(`
        SELECT EXTRACT(DOW FROM created_at) as dow, COUNT(*) as cnt 
        FROM orders 
        WHERE store_id = $1 
        GROUP BY dow 
        ORDER BY cnt DESC 
        LIMIT 1
      `, [storeId])
    ]);

    const m = metricsRes.rows[0];
    const totalItems = parseInt(m.total_items);
    const lowItems = parseInt(m.low_items);
    const stockHealth = totalItems > 0 ? Math.round(((totalItems - lowItems) / totalItems) * 100) : 100;

    return NextResponse.json({
      todayOrders: parseInt(m.today_orders),
      todayRevenue: parseFloat(m.today_revenue),
      pendingPickup: parseInt(m.pending_pickup),
      activeGarments: parseInt(m.active_garments_count),
      totalOrders: parseInt(m.total_orders),
      totalCustomers: parseInt(m.total_customers_count),
      totalRevenue: parseFloat(m.total_revenue),
      recentOrders: recentOrdersRes.rows,
      inventoryAlerts: lowItems,
      stockHealth,
      lowStockItems: lowStockRes.rows.map(r => r.item_name).join(' & ') || 'All stocked',
      predictiveInsight: busiestDayRes.rows.length > 0 
        ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][busiestDayRes.rows[0].dow] 
        : 'Saturday', // fallback
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=15',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
