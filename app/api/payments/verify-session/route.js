import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { query } from '@/lib/db/db';

let stripeInstance = null;
function getStripe() {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key missing in environment variables');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }
  return stripeInstance;
}

export async function POST(req) {
  try {
    const stripe = getStripe();
    const { session_id } = await req.json();

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
    }

    const storeId = session.metadata?.store_id;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session metadata' }, { status: 400 });
    }

    // Activate the store
    await query(
      `UPDATE stores SET subscription_status = 'active' WHERE id = $1`,
      [storeId]
    );

    return NextResponse.json({ success: true, store_id: storeId });
  } catch (error) {
    console.error('Verify Session Error:', error);
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 });
  }
}
