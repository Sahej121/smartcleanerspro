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

    // Aggregate data across ALL stores
    
    // 1. Total Stores
    const storesRes = await query('SELECT COUNT(*) as totalstores FROM stores');
    const totalStores = parseInt(storesRes.rows[0].totalstores);

    // 2. Active Users (Across all stores)
    const usersRes = await query('SELECT COUNT(*) as totalusers FROM users');
    const totalUsers = parseInt(usersRes.rows[0].totalusers);

    // 3. Global Total Revenue (using 'paid' status from schema)
    const revenueRes = await query("SELECT COALESCE(SUM(total_amount), 0) as globalrevenue FROM orders WHERE payment_status = $1", ['paid']);
    const globalRevenue = parseFloat(revenueRes.rows[0].globalrevenue);

    // 4. Global Active Orders (processing, received, ready)
    const activeRes = await query(`
      SELECT COUNT(*) as globalactiveorders FROM orders 
      WHERE status IN ('received', 'processing', 'ready')
    `);
    const globalActiveOrders = parseInt(activeRes.rows[0].globalactiveorders);

    // 5. Stores list with individual performance
    const storesData = await query(`
      SELECT 
        s.id, s.store_name, s.city, s.status, s.subscription_status, s.created_at,
        COUNT(DISTINCT u.id) as staff_count,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) as revenue
      FROM stores s
      LEFT JOIN users u ON u.store_id = s.id
      LEFT JOIN orders o ON o.store_id = s.id
      GROUP BY s.id
    `);

    // 6. SaaS Metrics (Mocked for now based on store counts)
    const subPrice = 4999; // Base price per store
    const mrr = totalStores * subPrice;
    const churn = 0.5; // Mocked 0.5% churn

    return NextResponse.json({
      totalStores,
      totalUsers,
      globalRevenue,
      globalActiveOrders,
      stores: storesData.rows,
      mrr,
      churn,
      systemHealth: '100% Online'
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
