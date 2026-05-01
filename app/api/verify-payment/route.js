import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getClient } from '@/lib/db/db';

/**
 * STEP 3: BACKEND - Verify Signature
 * Endpoint: POST /api/verify-payment
 */
export async function POST(request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internal_order_id } = await request.json();

    // Validate missing fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required Razorpay fields' },
        { status: 400 }
      );
    }

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
    
    if (!secret) {
      console.error('[Razorpay Verify] Missing RAZORPAY_KEY_SECRET');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    // Compare generated signature with razorpay_signature
    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Signature mismatch. Payment not verified.' },
        { status: 400 }
      );
    }

    // Optional: Update Database if signatures match
    if (internal_order_id) {
      const client = await getClient();
      try {
        await client.query('BEGIN');

        // Record the payment in the payments table
        await client.query(
          `INSERT INTO payments (order_id, amount, payment_method, transaction_id, payment_status, idempotency_key)
           SELECT id, total_amount, 'online', $1, 'completed', $2
           FROM orders WHERE id = $3 OR order_number = $4
           ON CONFLICT (idempotency_key) DO NOTHING`,
          [razorpay_payment_id, `rzp_${razorpay_payment_id}`, internal_order_id, internal_order_id]
        );

        // Update Order status
        await client.query(
          `UPDATE orders SET payment_status = 'paid', payment_method = 'online' 
           WHERE id = $1 OR order_number = $2`,
          [internal_order_id, internal_order_id]
        );

        await client.query('COMMIT');
      } catch (dbError) {
        await client.query('ROLLBACK');
        console.error('DB Update Error during verification:', dbError);
        // We still return success: true because the payment WAS verified at Razorpay
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment_id: razorpay_payment_id
    });

  } catch (error) {
    console.error('Razorpay Verification Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during verification' },
      { status: 500 }
    );
  }
}
