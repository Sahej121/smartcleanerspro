import { getDb } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const db = getDb();
    const { id } = await params;

    const customer = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as order_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = c.id AND payment_status = 'paid') as total_spent
      FROM customers c WHERE c.id = ?
    `).get(id);

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const orders = db.prepare(`
      SELECT o.*, 
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o WHERE o.customer_id = ? ORDER BY o.created_at DESC
    `).all(id);

    return NextResponse.json({ ...customer, orders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
