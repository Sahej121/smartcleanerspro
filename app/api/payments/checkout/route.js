import { getPaymentProvider } from '@/lib/payments/gateway-factory';
import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

/**
 * Initiate a checkout session
 * POST /api/payments/checkout
 * Body: { order_id, amount, is_saas_signup }
 */
export async function POST(request) {
  try {
    const { order_id, amount: customAmount, is_saas_signup, market, addons, store_id } = await request.json();

    let auth = null;
    if (!is_saas_signup) {
      auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
      if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    let amount = customAmount;
    let country = 'India';
    let storeName = "DrycleanersFlow";
    let description = `Payment for Order #${order_id}`;

    if (!is_saas_signup) {
      // Fetch order details from DB to verify amount for POS orders
      const orderRes = await query(
        'SELECT o.*, s.country, s.store_name FROM orders o JOIN stores s ON o.store_id = s.id WHERE o.id = $1 AND o.store_id = $2',
        [order_id, auth.user.store_id]
      );

      if (orderRes.rows.length === 0) {
        return NextResponse.json({ error: 'Order not found in your store' }, { status: 404 });
      }

      const order = orderRes.rows[0];
      amount = customAmount || parseFloat(order.total_amount);
      country = order.country || 'India';
      storeName = order.store_name || "DrycleanersFlow";
      description = `Payment for Order #${order.order_number}`;
    } else {
      // SaaS Signup flow
      description = "CleanFlow Subscription Activation";
      if (market && typeof market === 'string' && market.toLowerCase() !== 'india') {
        country = market; // e.g. 'us', 'europe', 'latam'
      } else {
        country = 'India';
      }
    }

    console.log(`[Checkout] Processing ${is_saas_signup ? 'SaaS' : 'POS'} Payment, Amount: ${amount}`);

    // Handle Zero-Amount
    if (amount < 1) {
      return NextResponse.json({
        success: true,
        provider: 'none',
        message: 'No payment required.'
      });
    }

    // Get the correct payment provider
    const providerConfig = await getPaymentProvider(country);

    if (providerConfig.provider === 'razorpay') {
      const currency = country === 'India' ? 'INR' : 'USD';
      const razorpayOrder = await providerConfig.createOrder(amount, currency, {
        order_id: order_id,
        is_saas: is_saas_signup ? 'true' : 'false'
      });

      if (!razorpayOrder.success) {
        throw new Error(razorpayOrder.error || 'Failed to create Razorpay order');
      }

      return NextResponse.json({
        success: true,
        provider: 'razorpay',
        key: providerConfig.clientKey,
        order_id: razorpayOrder.order_id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_details: {
          name: storeName,
          description: description,
          order_id: order_id
        }
      });
    }

    return NextResponse.json({ error: 'Payment provider not supported for this region' }, { status: 501 });

  } catch (error) {
    console.error('Checkout API Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
