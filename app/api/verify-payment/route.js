import { NextResponse } from 'next/server';
import { transaction } from '@/lib/db/db';
import { verifyPaymentSignature } from '@/lib/payments/razorpay-service';

export async function POST(req) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      internal_order_id,
    } = await req.json();

    // 1. Verify the signature using the consolidated service
    const isValid = verifyPaymentSignature(
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    );

    if (!isValid) {
      console.error('[VerifyPayment] Invalid signature for order:', internal_order_id);
      return NextResponse.json(
        { success: false, error: 'Signature mismatch. Payment not verified.' },
        { status: 400 }
      );
    }

    // 2. Perform database updates in a safe transaction
    if (internal_order_id) {
      await transaction(async (query) => {
        // Detect if internal_order_id is a UUID or an Order Number
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(internal_order_id);
        
        const orderRes = await query(
          `SELECT id, total_amount FROM orders 
           WHERE ${isUuid ? 'id = $1' : 'order_number = $1'} LIMIT 1`,
          [internal_order_id]
        );

        if (orderRes.rows.length === 0) {
          throw new Error('Order not found');
        }

        const order = orderRes.rows[0];

        // Record the payment
        await query(
          `INSERT INTO payments (order_id, amount, payment_method, transaction_id, payment_status, idempotency_key)
           VALUES ($1, $2, 'online', $3, 'completed', $4)
           ON CONFLICT (idempotency_key) DO NOTHING`,
          [order.id, order.total_amount, razorpay_payment_id, `rzp_${razorpay_payment_id}`]
        );

        // Update Order status
        await query(
          `UPDATE orders SET payment_status = 'paid', payment_method = 'online', updated_at = NOW() 
           WHERE id = $1`,
          [order.id]
        );
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment_id: razorpay_payment_id
    });
  } catch (error) {
    console.error('[VerifyPayment] Error processing payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

