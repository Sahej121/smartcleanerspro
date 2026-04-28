import { PRICING_MARKETS } from '../tier-config';
import { createRazorpayOrder } from './razorpay-service';

/**
 * Initialize a Razorpay order for a SaaS subscription signup.
 * @param {string} tier - Plan key (software_only, hardware_bundle)
 * @param {string} marketId - Geographic market (us, india, uae, etc)
 * @returns {Promise<object>} - Razorpay order details or error
 */
export async function initializeSubscriptionOrder(tier, marketId = 'us') {
  const market = PRICING_MARKETS[marketId] || PRICING_MARKETS.us;
  const priceStr = market.prices[tier];
  
  if (!priceStr) {
    throw new Error(`Invalid tier: ${tier}`);
  }

  // Convert "1,299" -> 1299
  const amount = parseFloat(priceStr.replace(/,/g, ''));
  const currency = marketId === 'india' ? 'INR' : (market.currency === '€' ? 'EUR' : 'USD');

  console.log(`[SubscriptionPayment] Initializing order for ${tier} in ${marketId}: ${currency}${amount}`);

  return await createRazorpayOrder(amount, currency, {
    purpose: 'SaaS Signup',
    tier: tier,
    market: marketId
  });
}
