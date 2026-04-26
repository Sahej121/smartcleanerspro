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

    const [storesRes, usersRes, revenueRes, activeRes, storesData] = await Promise.all([
      query(`
        SELECT
          COUNT(*)::int as totalstores,
          COUNT(*) FILTER (WHERE status = 'active')::int as activestores,
          COUNT(*) FILTER (WHERE status = 'suspended')::int as suspendedstores,
          COUNT(*) FILTER (WHERE status = 'idle')::int as idlestores
        FROM stores
      `),
      query('SELECT COUNT(*)::int as totalusers FROM users'),
      query(`
        SELECT
          COALESCE(SUM(total_amount), 0)::float as globalrevenue,
          COUNT(*) FILTER (WHERE payment_status = 'paid')::int as paidorders
        FROM orders
        WHERE payment_status = $1
      `, ['paid']),
      query(`
        SELECT COUNT(*)::int as globalactiveorders
        FROM orders 
        WHERE status IN ('received', 'processing', 'ready')
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

    const totalStores = storesRes.rows[0].totalstores;
    const activeStores = storesRes.rows[0].activestores;
    const suspendedStores = storesRes.rows[0].suspendedstores;
    const idleStores = storesRes.rows[0].idlestores;
    const totalUsers = usersRes.rows[0].totalusers;
    const globalRevenue = revenueRes.rows[0].globalrevenue;
    const globalActiveOrders = activeRes.rows[0].globalactiveorders;

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
      paidOrders: revenueRes.rows[0].paidorders,
      systemHealth: '100% Online'
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
