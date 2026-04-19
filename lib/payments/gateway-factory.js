import { createRazorpayOrder } from './razorpay-service';

/**
 * Determines which payment gateway to use based on the country.
 * @param {string} country - The store's country (e.g. 'India', 'United States')
 */
export async function getPaymentProvider(country = 'India') {
  if (country.toLowerCase() === 'india') {
    return {
      provider: 'razorpay',
      createOrder: createRazorpayOrder,
      clientKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    };
  }

  // Default to Stripe for international
  return {
    provider: 'stripe',
    clientKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    // createOrder: createStripeSession (to be implemented)
  };
}
