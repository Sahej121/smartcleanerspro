'use client';

import { useState } from 'react';
import Script from 'next/script';

/**
 * RazorpayButton Component
 * 
 * @param {number} amount - Amount in paise (1 INR = 100 paise)
 * @param {string} currency - Currency code (default: 'INR')
 * @param {string} receipt - Unique receipt ID (internal order ID)
 * @param {function} onSuccess - Callback function on successful payment verification
 * @param {function} onError - Callback function on payment failure or error
 * @param {string} buttonText - Text to display on the button
 * @param {string} className - Optional CSS classes for the button
 * @param {object} prefill - Optional prefill data (name, email, contact)
 */
export default function RazorpayButton({ 
  amount, 
  currency = 'INR', 
  receipt, 
  onSuccess, 
  onError,
  buttonText = 'Pay Now',
  className = '',
  prefill = {}
}) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (amount < 100) {
      alert('Minimum amount should be ₹1 (100 paise)');
      return;
    }

    setLoading(true);
    try {
      // 1. Create order on backend
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, receipt }),
      });
      
      const orderData = await response.json();

      if (!response.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // 2. Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Smart Cleaners Pro',
        description: `Payment for Order #${receipt}`,
        order_id: orderData.order_id,
        handler: async function (response) {
          // This handler is called when payment is successful
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                internal_order_id: receipt, // Pass receipt to link with DB
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              if (onSuccess) onSuccess(verifyData, response);
            } else {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (vErr) {
            if (onError) onError(vErr);
          }
        },
        prefill: {
          name: prefill.name || '',
          email: prefill.email || '',
          contact: prefill.contact || '',
        },
        theme: {
          color: '#3B82F6', // Tailwind blue-500
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      // 3. Open Razorpay Modal
      const rzp1 = new window.Razorpay(options);
      
      rzp1.on('payment.failed', function (response) {
        setLoading(false);
        if (onError) onError(response.error);
      });

      rzp1.open();
    } catch (err) {
      console.error('Razorpay Error:', err);
      if (onError) onError(err);
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <button
        onClick={handlePayment}
        disabled={loading}
        className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          buttonText
        )}
      </button>
    </>
  );
}
