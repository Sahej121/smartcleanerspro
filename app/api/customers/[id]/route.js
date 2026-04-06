import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await params;

    const customerRes = await query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as order_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = c.id AND payment_status = 'paid') as total_spent
       FROM customers c WHERE c.id = $1 AND c.store_id = $2`,
      [id, auth.user.store_id]
    );

    if (customerRes.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const ordersRes = await query(
      `SELECT o.*, 
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
       FROM orders o WHERE o.customer_id = $1 ORDER BY o.created_at DESC`,
      [id]
    );

    return NextResponse.json({ ...customerRes.rows[0], orders: ordersRes.rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await params;
    const body = await request.json();
    const { name, phone, email, address, notes, loyalty_points } = body;

    const res = await query(
      `UPDATE customers SET name = COALESCE($1, name), phone = COALESCE($2, phone), email = COALESCE($3, email), 
       address = COALESCE($4, address), notes = COALESCE($5, notes), loyalty_points = COALESCE($6, loyalty_points)
       WHERE id = $7 AND store_id = $8 RETURNING *`,
      [name, phone, email, address, notes, loyalty_points, id, auth.user.store_id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireRole(request, ['owner', 'manager']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await params;

    const res = await query('DELETE FROM customers WHERE id = $1 AND store_id = $2 RETURNING id', [id, auth.user.store_id]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
