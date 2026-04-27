import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';
import { requireRole } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await requireRole(req, ['owner']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const payload = auth.user;

    // Only SaaS root owner can access master stats
    if (payload.id !== 1) {
      return NextResponse.json({ error: 'Forbidden. Root owner access required.' }, { status: 403 });
    }

    const [globalStatsRes, storesData] = await Promise.all([
      query(`
        WITH store_counts AS (
          SELECT
            COUNT(*)::int as totalstores,
            COUNT(*) FILTER (WHERE status = 'active')::int as activestores,
            COUNT(*) FILTER (WHERE status = 'suspended')::int as suspendedstores,
            COUNT(*) FILTER (WHERE status = 'idle')::int as idlestores
          FROM stores
        ),
        user_counts AS (
          SELECT COUNT(*)::int as totalusers FROM users
        ),
        order_counts AS (
          SELECT
            COALESCE(SUM(total_amount), 0)::float as globalrevenue,
            COUNT(*) FILTER (WHERE payment_status = 'paid')::int as paidorders,
            COUNT(*) FILTER (WHERE status IN ('received', 'processing', 'ready'))::int as globalactiveorders
          FROM orders
        )
        SELECT * FROM store_counts, user_counts, order_counts
      `),
      query(`
      SELECT 
        s.id, s.store_name, s.city, s.status, s.subscription_status, s.subscription_tier, s.created_at,
        COUNT(DISTINCT u.id) as staff_count,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) as revenue
      FROM stores s
      LEFT JOIN users u ON u.store_id = s.id
      LEFT JOIN orders o ON o.store_id = s.id
      GROUP BY s.id
      ORDER BY revenue DESC, s.created_at DESC
      `),
    ]);

    const g = globalStatsRes.rows[0];
    const totalStores = g.totalstores;
    const activeStores = g.activestores;
    const suspendedStores = g.suspendedstores;
    const idleStores = g.idlestores;
    const totalUsers = g.totalusers;
    const globalRevenue = g.globalrevenue;
    const globalActiveOrders = g.globalactiveorders;

    const tierPricing = {
      software_only: 25,
      hardware_bundle: 35,
      enterprise: 99,
    };
    const mrr = storesData.rows.reduce((sum, store) => sum + (tierPricing[store.subscription_tier] || tierPricing.software_only), 0);
    const churn = totalStores === 0 ? 0 : Number(((suspendedStores / totalStores) * 100).toFixed(2));

    return NextResponse.json({
      totalStores,
      activeStores,
      suspendedStores,
      idleStores,
      totalUsers,
      globalRevenue,
      total_revenue: globalRevenue,
      globalActiveOrders,
      activeOrders: globalActiveOrders,
      stores: storesData.rows,
      mrr,
      churn,
      paidOrders: g.paidorders,
      systemHealth: '100% Online'
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
