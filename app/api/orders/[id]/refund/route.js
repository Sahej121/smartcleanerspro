import { query, getClient } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

// Process a refund for an order
export async function POST(request, { params }) {
  const auth = await requireRole(request, ['owner', 'manager']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const client = await getClient();
  try {
    const { amount, reason, payment_method } = await request.json();

    if (!amount) {
      return NextResponse.json({ error: 'Refund amount is required' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Get order total
    const orderRes = await client.query('SELECT total_amount, payment_status FROM orders WHERE id = $1', [id]);
    if (orderRes.rows.length === 0) throw new Error('Order not found');
    const orderTotal = parseFloat(orderRes.rows[0].total_amount);

    // 2. Insert refund record (negative amount in payments)
    const refundRes = await client.query(
      `INSERT INTO payments (order_id, amount, payment_method, payment_status, transaction_id)
       VALUES ($1, $2, $3, 'refunded', $4) RETURNING id`,
      [id, -Math.abs(amount), payment_method || 'cash', reason || 'Customer refund']
    );

    // 3. Calculate remaining total paid
    const totalPaidRes = await client.query(
      "SELECT SUM(amount) as total_paid FROM payments WHERE order_id = $1 AND payment_status != 'failed'",
      [id]
    );
    const currentTotalPaid = parseFloat(totalPaidRes.rows[0].total_paid || 0);

    // 4. Update order payment status
    let newStatus = 'paid';
    if (currentTotalPaid <= 0) {
      newStatus = 'refunded';
    } else if (currentTotalPaid < orderTotal) {
      newStatus = 'partial';
    }

    await client.query(
      'UPDATE orders SET payment_status = $1 WHERE id = $2',
      [newStatus, id]
    );

    await client.query('COMMIT');

    return NextResponse.json({ 
      success: true, 
      refund_id: refundRes.rows[0].id,
      remaining_paid: currentTotalPaid,
      order_status: newStatus 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
