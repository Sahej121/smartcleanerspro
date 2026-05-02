import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';

export async function POST(request) {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const { amount: clientAmount, currency = 'INR', receipt } = await request.json();

    if (!receipt) {
      return NextResponse.json(
        { error: 'Order receipt ID is required for verification' },
        { status: 400 }
      );
    }

    // Fetch order from DB to verify amount
    // Detect if receipt is a UUID or an Order Number
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(receipt);
    
    const orderRes = await query(
      `SELECT id, total_amount, payment_status FROM orders 
       WHERE ${isUuid ? 'id = $1' : 'order_number = $1'} LIMIT 1`,
      [receipt]
    );

    if (orderRes.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderRes.rows[0];

    // If order is already paid, don't allow creating another Razorpay order
    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order is already paid' }, { status: 400 });
    }

    // Always use DB amount for security. Razorpay expects amount in paise.
    // If clientAmount is provided and is a partial payment, we could allow it, 
    // but for now let's enforce full payment from DB as suggested in the PDF.
    const finalAmount = Math.round(order.total_amount * 100); 

    // Validate amount >= 100 paise (₹1)
    if (finalAmount < 100) {
      return NextResponse.json(
        { error: 'Minimum amount must be 100 paise (₹1)' },
        { status: 400 }
      );
    }

    const options = {
      amount: finalAmount,
      currency,
      receipt: receipt.toString(),
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return NextResponse.json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    // Handle auth failures or API errors
    const status = error.statusCode === 401 ? 401 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to create Razorpay order' },
      { status }
    );
  }
}
