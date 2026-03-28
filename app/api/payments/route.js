import { query, getClient } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

// Add a payment to an existing order (Split payment, Pay on Collection, Partial payment)
export async function POST(request) {
  const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const client = await getClient();
  try {
    const { order_id, amount, payment_method, transaction_id, idempotency_key } = await request.json();

    if (!order_id || !amount) {
      return NextResponse.json({ error: 'Order ID and amount are required' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Insert payment record
    const paymentRes = await client.query(
      `INSERT INTO payments (order_id, amount, payment_method, transaction_id, payment_status, idempotency_key)
       VALUES ($1, $2, $3, $4, 'completed', $5) RETURNING id`,
      [order_id, amount, payment_method || 'cash', transaction_id || null, idempotency_key || null]
    );

    // 2. Calculate total paid for this order
    const totalPaidRes = await client.query(
      'SELECT SUM(amount) as total_paid FROM payments WHERE order_id = $1 AND payment_status = $2',
      [order_id, 'completed']
    );
    const totalPaid = parseFloat(totalPaidRes.rows[0].total_paid || 0);

    // 3. Get order total
    const orderRes = await client.query('SELECT total_amount FROM orders WHERE id = $1', [order_id]);
    if (orderRes.rows.length === 0) throw new Error('Order not found');
    const orderTotal = parseFloat(orderRes.rows[0].total_amount);

    // 4. Update order payment status
    let newStatus = 'pending';
    if (totalPaid >= orderTotal) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partial';
    }

    await client.query(
      'UPDATE orders SET payment_status = $1 WHERE id = $2',
      [newStatus, order_id]
    );

    // 5. Earn Loyalty Points (1 point per ₹100)
    const pointsToEarn = Math.floor(amount / 100);
    if (pointsToEarn > 0) {
      await client.query(
        `UPDATE customers SET loyalty_points = loyalty_points + $1 
         WHERE id = (SELECT customer_id FROM orders WHERE id = $2)`,
        [pointsToEarn, order_id]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({ 
      success: true, 
      payment_id: paymentRes.rows[0].id,
      total_paid: totalPaid,
      order_status: newStatus 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
