import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('cleanflow_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);

    // Only owners can access master stats
    if (!payload || payload.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden. Owner access required.' }, { status: 403 });
    }

    const db = getDb();

    // Aggregate data across ALL stores
    
    // 1. Total Stores
    const { totalStores } = db.prepare('SELECT COUNT(*) as totalStores FROM stores').get();

    // 2. Active Users (Across all stores)
    const { totalUsers } = db.prepare('SELECT COUNT(*) as totalUsers FROM users').get();

    // 3. Global Total Revenue
    const { globalRevenue } = db.prepare('SELECT SUM(total_amount) as globalRevenue FROM orders WHERE payment_status = ?').get('completed');

    // 4. Global Active Orders (processing, received, ready)
    const { globalActiveOrders } = db.prepare(`
      SELECT COUNT(*) as globalActiveOrders FROM orders 
      WHERE status IN ('received', 'processing', 'ready')
    `).get();

    // 5. Stores list with individual performance
    const storesData = db.prepare(`
      SELECT 
        s.id, s.store_name, s.city,
        COUNT(DISTINCT u.id) as staff_count,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(CASE WHEN o.payment_status = 'completed' THEN o.total_amount ELSE 0 END), 0) as revenue
      FROM stores s
      LEFT JOIN users u ON u.store_id = s.id
      LEFT JOIN orders o ON o.store_id = s.id
      GROUP BY s.id
    `).all();

    return NextResponse.json({
      totalStores,
      totalUsers,
      globalRevenue: globalRevenue || 0,
      globalActiveOrders,
      stores: storesData
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
