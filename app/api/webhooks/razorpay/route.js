import { query, getClient } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    
    // Verify Webhook Signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid Razorpay Webhook Signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    const client = await getClient();

    try {
      if (event.event === 'payment.captured') {
        const payment = event.payload.payment.entity;
        const orderId = payment.notes.order_id;
        const amount = payment.amount / 100; // Convert from paisa

        await client.query('BEGIN');

        // 1. Record the payment
        await client.query(
          `INSERT INTO payments (order_id, amount, payment_method, transaction_id, payment_status, idempotency_key)
           VALUES ($1, $2, $3, $4, 'completed', $5) ON CONFLICT (idempotency_key) DO NOTHING`,
          [orderId, amount, 'online', payment.id, 'completed', `razorpay_${payment.id}`]
        );

        // 2. Update Order Status
        const totalPaidRes = await client.query(
          'SELECT SUM(amount) as total_paid FROM payments WHERE order_id = $1 AND payment_status = $2',
          [orderId, 'completed']
        );
        const totalPaid = parseFloat(totalPaidRes.rows[0].total_paid || 0);

        const orderRes = await client.query('SELECT total_amount FROM orders WHERE id = $1', [orderId]);
        const orderTotal = parseFloat(orderRes.rows[0].total_amount);

        let newStatus = 'partial';
        if (totalPaid >= orderTotal) newStatus = 'paid';

        await client.query(
          'UPDATE orders SET payment_status = $1, payment_method = $2 WHERE id = $3',
          [newStatus, 'online', orderId]
        );
        
        await client.query('COMMIT');
        console.log(`Payment captured for Order #${orderId}`);
      }

      return NextResponse.json({ success: true });
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
