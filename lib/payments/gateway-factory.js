import { createRazorpayOrder } from './razorpay-service';
import { createStripeSession } from './stripe-service';

/**
 * Determines which payment gateway to use based on the country.
 * @param {string} country - The store's country (e.g. 'India', 'United States')
 */
export async function getPaymentProvider(country = 'India') {
  // We only support Razorpay for now across all markets
  return {
    provider: 'razorpay',
    createOrder: createRazorpayOrder,
    clientKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
  };
}
