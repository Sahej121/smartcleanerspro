import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';
import { requireRole } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const ownerId = auth.user.id;
    const { searchParams } = new URL(request.url);
    const storeIdParam = searchParams.get('storeId');

    const storeRows = await query(
      `SELECT id, store_name, city, subscription_tier, status
       FROM stores
       WHERE owner_id = $1
       ORDER BY created_at DESC`,
      [ownerId]
    );
    let storeIds = storeRows.rows.map(s => s.id);

    // Optional drill-down to a single store (must belong to this owner)
    if (storeIdParam && storeIdParam !== 'all') {
      const requested = parseInt(storeIdParam, 10);
      if (!Number.isFinite(requested)) {
        return NextResponse.json({ error: 'Invalid storeId' }, { status: 400 });
      }
      if (!storeIds.includes(requested)) {
        return NextResponse.json({ error: 'Store not found or access denied' }, { status: 404 });
      }
      storeIds = [requested];
    }

    if (storeIds.length === 0) {
      return NextResponse.json({
        todayOrders: 0,
        todayRevenue: 0,
        pendingPickup: 0,
        activeGarments: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        totalStaff: 0,
        recentOrders: [],
        inventoryAlerts: 0,
        stockHealth: 100,
        lowStockItems: 'All stocked',
        stores: [],
      });
    }

    const today = new Date().toISOString().split('T')[0];

    const todayOrders = await query(
      `SELECT COUNT(*) as count
       FROM orders
       WHERE created_at::date = $1::date AND store_id = ANY($2::int[])`,
      [today, storeIds]
    );

    const todayRevenue = await query(
      `SELECT COALESCE(SUM(total_amount), 0) as total
       FROM orders
       WHERE created_at::date = $1::date AND payment_status = 'paid' AND store_id = ANY($2::int[])`,
      [today, storeIds]
    );

    const pendingPickup = await query(
      `SELECT COUNT(*) as count
       FROM orders
       WHERE status = 'ready' AND store_id = ANY($1::int[])`,
      [storeIds]
    );

    const activeGarments = await query(
      `SELECT COUNT(oi.*) as count
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.status NOT IN ('ready', 'delivered') AND o.store_id = ANY($1::int[])`,
      [storeIds]
    );

    const totalOrders = await query(
      `SELECT COUNT(*) as count FROM orders WHERE store_id = ANY($1::int[])`,
      [storeIds]
    );
    const totalCustomers = await query(
      `SELECT COUNT(*) as count FROM customers WHERE store_id = ANY($1::int[])`,
      [storeIds]
    );
    const totalRevenue = await query(
      `SELECT COALESCE(SUM(total_amount), 0) as total
       FROM orders
       WHERE payment_status = 'paid' AND store_id = ANY($1::int[])`,
      [storeIds]
    );

    const recentOrders = await query(
      `
      SELECT o.id, o.order_number, o.status, o.total_amount, o.payment_status, o.created_at,
             c.name as customer_name,
             s.store_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN stores s ON o.store_id = s.id
      WHERE o.store_id = ANY($1::int[])
      ORDER BY o.created_at DESC
      LIMIT 12
      `,
      [storeIds]
    );

    const staffCount = await query(
      `SELECT COUNT(*) as count
       FROM users u
       JOIN stores s ON u.store_id = s.id
       WHERE s.id = ANY($1::int[]) AND u.role != 'owner'`,
      [storeIds]
    );

    // Inventory health across all owned stores
    const inventoryTotal = await query(
      `SELECT COUNT(*) as count FROM inventory WHERE store_id = ANY($1::int[])`,
      [storeIds]
    );
    const inventoryLow = await query(
      `SELECT COUNT(*) as count
       FROM inventory
       WHERE quantity <= reorder_level AND store_id = ANY($1::int[])`,
      [storeIds]
    );
    const lowStockItems = await query(
      `SELECT item_name
       FROM inventory
       WHERE quantity <= reorder_level AND store_id = ANY($1::int[])
       ORDER BY (reorder_level - quantity) DESC
       LIMIT 3`,
      [storeIds]
    );

    const totalItems = parseInt(inventoryTotal.rows[0].count, 10);
    const lowItems = parseInt(inventoryLow.rows[0].count, 10);
    const stockHealth = totalItems > 0 ? Math.round(((totalItems - lowItems) / totalItems) * 100) : 100;

    // Stores earnings snapshot
    // Always return the full store earnings list so the dropdown has context.
    const stores = await query(
      `
      SELECT s.id, s.store_name, s.city,
             (SELECT COUNT(*) FROM orders o WHERE o.store_id = s.id) as order_count,
             (SELECT COALESCE(SUM(total_amount), 0) FROM orders o WHERE o.store_id = s.id AND o.payment_status = 'paid') as total_revenue
      FROM stores s
      WHERE s.owner_id = $1
      ORDER BY total_revenue DESC
      `,
      [ownerId]
    );

    return NextResponse.json({
      todayOrders: parseInt(todayOrders.rows[0].count, 10),
      todayRevenue: parseFloat(todayRevenue.rows[0].total),
      pendingPickup: parseInt(pendingPickup.rows[0].count, 10),
      activeGarments: parseInt(activeGarments.rows[0].count, 10),
      totalOrders: parseInt(totalOrders.rows[0].count, 10),
      totalCustomers: parseInt(totalCustomers.rows[0].count, 10),
      totalRevenue: parseFloat(totalRevenue.rows[0].total),
      totalStaff: parseInt(staffCount.rows[0].count, 10),
      recentOrders: recentOrders.rows,
      inventoryAlerts: lowItems,
      stockHealth,
      lowStockItems: lowStockItems.rows.map(r => r.item_name).join(' & ') || 'All stocked',
      stores: stores.rows,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

