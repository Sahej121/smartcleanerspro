import { query } from '@/lib/db/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CustomersClient from './CustomersClient';

export const metadata = {
  title: 'Customer Registry | CleanFlow',
};

export default async function CustomersPage({ searchParams: searchParamsPromise }) {
  const searchParams = await searchParamsPromise;
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const search = searchParams.search;

  let sql = `
    SELECT c.*, 
      (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as order_count,
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = c.id AND payment_status = 'paid') as total_spent
    FROM customers c
    WHERE c.store_id = $1
  `;
  const params = [session.store_id];

  if (search) {
    sql += ' AND (c.name ILIKE $2 OR c.phone ILIKE $3 OR c.email ILIKE $4)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY c.created_at DESC';

  const res = await query(sql, params);

  return <CustomersClient initialCustomers={res.rows} />;
}
