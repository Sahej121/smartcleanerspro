import Razorpay from 'razorpay';

let razorpayInstance = null;

function getRazorpay() {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials missing in environment variables');
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

/**
 * Create a Razorpay Order
 * @param {number} amount - Amount in basic units (e.g. Rupee)
 * @param {string} currency - Currency code (e.g. INR)
 * @param {object} metadata - Extra info (order_id, customer_id, etc.)
 */
export async function createRazorpayOrder(amount, currency = 'INR', metadata = {}) {
  try {
    const rzp = getRazorpay();
    
    // Razorpay minimum amount is 100 paise (₹1)
    if (amount < 1) {
      return { success: false, error: 'Amount must be at least ₹1 for Razorpay' };
    }

    // Razorpay expects amount in paisa (smallest unit)
    // Notes must have string values
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
    // Razorpay errors are often weird objects, let's extract as much as possible
    console.error('Razorpay Order Creation Error Full:', error);
    const errorMsg = error.error?.description || error.description || error.message || 'Unknown Razorpay error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Verify Razorpay Signature
 */
export function verifyPaymentSignature(paymentId, orderId, signature) {
  const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!rzpKeySecret) return false;
  
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', rzpKeySecret);
  hmac.update(orderId + "|" + paymentId);
  const generatedSignature = hmac.digest('hex');
  return generatedSignature === signature;
}
