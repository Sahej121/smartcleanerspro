import Razorpay from 'razorpay';
import { createHmac } from 'crypto';

function getRazorpay() {
  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    console.error('[Razorpay] Missing credentials on server-side.');
    throw new Error('Razorpay credentials missing in environment variables');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Create a Razorpay Order
 */
export async function createRazorpayOrder(amount, currency = 'INR', metadata = {}) {
  try {
    const rzp = getRazorpay();
    
    if (amount < 1) {
      return { success: false, error: 'Amount must be at least ₹1 for Razorpay' };
    }

    const sanitizedNotes = {};
    for (const [key, value] of Object.entries(metadata)) {
      sanitizedNotes[key] = String(value);
    }

    const options = {
      amount: Math.round(amount * 100), 
      currency: currency,
      receipt: String(metadata.order_id || `rcpt_${Date.now()}`),
      notes: sanitizedNotes,
    };

    const order = await rzp.orders.create(options);
    return {
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    };
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    const errorMsg = error.error?.description || error.description || error.message || 'Unknown Razorpay error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Verify Razorpay Signature
 * Uses the secret from environment variables by default.
 */
export function verifyPaymentSignature(paymentId, orderId, signature) {
  const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!rzpKeySecret) {
    console.error('[Razorpay] Verification failed: RAZORPAY_KEY_SECRET not set');
    return false;
  }
  
  try {
    const expectedSignature = createHmac('sha256', rzpKeySecret)
      .update(orderId + "|" + paymentId)
      .digest('hex');
    
    return expectedSignature === signature;
  } catch (err) {
    console.error('[Razorpay] Signature verification exception:', err);
    return false;
  }
}

