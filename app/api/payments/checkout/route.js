import { getPaymentProvider } from '@/lib/payments/gateway-factory';
import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

/**
 * Initiate a checkout session
 * POST /api/payments/checkout
 * Body: { order_id, amount, currency }
 */
export async function POST(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { order_id, amount: customAmount } = await request.json();

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Fetch order details from DB to verify amount
    const orderRes = await query(
      'SELECT o.*, s.country FROM orders o JOIN stores s ON o.store_id = s.id WHERE o.id = $1 AND o.store_id = $2',
      [order_id, auth.user.store_id]
    );

    if (orderRes.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found in your store' }, { status: 404 });
    }

    const order = orderRes.rows[0];
    const amount = customAmount || parseFloat(order.total_amount);

    console.log(`[Checkout] Processing Order #${order.order_number} (ID: ${order.id}), Amount: ₹${amount}`);

    // 2. Handle Zero-Amount Orders (e.g. fully paid by points/discounts)
    if (amount < 1) {
      console.log(`[Checkout] Amount ₹${amount} is below Gateway minimum. Marking as paid-bypass.`);
      return NextResponse.json({
        success: true,
        provider: 'none',
        message: 'Order total is zero or covered by discounts. No payment required.'
      });
    }

    // 3. Get the correct payment provider
    const providerConfig = await getPaymentProvider(order.country || 'India');

    if (providerConfig.provider === 'razorpay') {
      const razorpayOrder = await providerConfig.createOrder(amount, 'INR', {
        order_id: order.id,
        order_number: order.order_number,
        store_id: order.store_id,
        customer_id: order.customer_id
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
          name: auth.user.store_name || "Dry Cleaner's flow",
          description: `Payment for Order #${order.order_number}`,
          order_id: order.id
        }
      });
    }

    // Stripe implementation placeholder
    return NextResponse.json({ error: 'Stripe integration coming soon' }, { status: 501 });

  } catch (error) {
    console.error('Checkout API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
