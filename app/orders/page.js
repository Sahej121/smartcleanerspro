import { query } from '@/lib/db/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import OrdersClient from './OrdersClient';

export const metadata = {
  title: 'Order Registry | CleanFlow',
};

export default async function OrdersPage({ searchParams: searchParamsPromise }) {
  const searchParams = await searchParamsPromise;
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const status = searchParams.status;
  const search = searchParams.search;
  const page = Math.max(parseInt(searchParams.page) || 1, 1);
  const limit = Math.min(parseInt(searchParams.limit) || 20, 100);
  const offset = (page - 1) * limit;

  let sql = `
    SELECT 
      o.*, 
      c.name as customer_name, 
      c.phone as customer_phone,
      COUNT(oi.id) as item_count,
      COUNT(*) OVER() as total_count
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.store_id = $1
  `;
  const conditions = [];
  const params = [session.store_id];
  let paramIndex = 2;

  if (status && status !== 'all') {
    conditions.push(`o.status = $${paramIndex++}`);
    params.push(status);
  }

  if (search) {
    conditions.push(`(o.order_number ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex + 1} OR c.phone ILIKE $${paramIndex + 2})`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    paramIndex += 3;
  }

  if (conditions.length > 0) {
    sql += ' AND ' + conditions.join(' AND ');
  }

  sql += ` GROUP BY o.id, c.name, c.phone ORDER BY o.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const res = await query(sql, params);
  const total = res.rows.length > 0 ? parseInt(res.rows[0].total_count) : 0;

  return (
    <OrdersClient 
      initialOrders={res.rows} 
      pagination={{
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }} 
    />
  );
}
