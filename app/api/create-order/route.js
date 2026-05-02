import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const { amount, currency = 'INR', receipt } = await request.json();

    // Validate amount >= 100 paise
    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: 'Minimum amount must be 100 paise (₹1)' },
        { status: 400 }
      );
    }

    const options = {
      amount: Math.round(amount),
      currency,
      receipt: receipt?.toString(),
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
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
