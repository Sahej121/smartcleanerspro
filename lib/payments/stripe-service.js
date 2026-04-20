import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // using recent API version
});

/**
 * Creates a Stripe Checkout Session
 * @param {number} amount - The total amount to charge
 * @param {string} currency - The currency (e.g. 'usd', 'eur')
 * @param {object} metadata - Custom metadata for tracking the order
 * @param {string} origin - The origin URL for redirect returns (e.g. 'http://localhost:3000')
 * @returns {object} - Returns { success: true, url: string, session_id: string } or { success: false, error: string }
 */
export async function createStripeSession(amount, currency = 'usd', metadata = {}, origin) {
  try {
    if (!origin) {
      throw new Error("Origin URL required for Stripe redirects");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: metadata.description || 'CleanFlow Subscription Checkout',
              description: metadata.addons ? `Includes: ${metadata.addons}` : undefined,
            },
            unit_amount: Math.round(amount * 100), // Stripe expects amounts in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      metadata: {
        order_id: metadata.order_id,
        store_id: metadata.store_id,
        is_saas: metadata.is_saas,
        ...metadata,
      },
    });

    return {
      success: true,
      url: session.url,
      session_id: session.id,
    };
  } catch (error) {
    console.error('Stripe Session Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
