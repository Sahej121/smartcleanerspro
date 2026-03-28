import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function GET(request, { params }) {
  const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;

  try {
    const orderRes = await query(
      `SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address, s.name as store_name, s.address as store_address, s.phone as store_phone
       FROM orders o 
       LEFT JOIN customers c ON o.customer_id = c.id 
       CROSS JOIN stores s
       WHERE o.id = $1 LIMIT 1`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const itemsRes = await query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id]
    );

    const paymentsRes = await query(
      'SELECT * FROM payments WHERE order_id = $1',
      [id]
    );

    const order = orderRes.rows[0];
    const items = itemsRes.rows;
    const payments = paymentsRes.rows;

    // This returns structured data that the frontend can use to render a printable invoice
    return NextResponse.json({
      order,
      items,
      payments,
      printDate: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
