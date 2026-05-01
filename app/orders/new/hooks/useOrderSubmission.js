'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { offlineStore } from '../utils/offlineStore';

export function useOrderSubmission(selectedCustomer, cart, total, applicableVolDiscount, couponDiscount, redeemedPoints, couponData, schedule, payAtPickup, payments, editId) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const handlePayOnline = async (orderId) => {
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate payment');
      if (data.provider === 'none') return { success: true };

      if (data.provider === 'razorpay') {
        return new Promise((resolve) => {
          const options = {
            key: data.key,
            amount: data.amount,
            currency: data.currency,
            name: data.order_details.name,
            description: data.order_details.description,
            order_id: data.order_id,
            handler: async function (response) {
              try {
                const verifyRes = await fetch('/api/verify-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    internal_order_id: orderId,
                  }),
                });
                const verifyData = await verifyRes.json();
                resolve({ success: verifyRes.ok && verifyData.success });
              } catch (err) {
                console.error('Payment verification failed:', err);
                resolve({ success: false, error: err.message });
              }
            },
            modal: { ondismiss: () => resolve({ success: false, dismissed: true }) },
            prefill: { name: selectedCustomer?.name || '', contact: selectedCustomer?.phone || '' },
            theme: { color: '#10b981' },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        });
      }
      return { success: false, error: 'Unsupported payment provider' };
    } catch (error) {
      console.error('Payment initialization failed:', error);
      return { success: false, error: error.message };
    }
  };

  const handleSubmitOrder = async (force = false) => {
    if (!selectedCustomer) {
      alert('Select a customer');
      return;
    }

    if (schedule.pickupDate && schedule.deliveryDate) {
      const pDate = new Date(`${schedule.pickupDate}T${schedule.pickupTime || '00:00'}`);
      const dDate = new Date(`${schedule.deliveryDate}T${schedule.deliveryTime || '00:00'}`);
      if (pDate > dDate) {
        alert('Pickup date/time cannot be later than delivery date/time.');
        return;
      }
    }

    const orderPayload = {
      customer_id: selectedCustomer.id,
      items: cart,
      totalAmount: total,
      discountAmount: applicableVolDiscount + couponDiscount + redeemedPoints,
      payments: payAtPickup ? [] : payments,
      redeemedPoints: redeemedPoints,
      coupon_id: couponData?.id,
      schedule: schedule,
      force: force
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const offlineId = await offlineStore.saveOfflineOrder(orderPayload);
      alert(`System Offline. Order saved locally (ID: ${offlineId}) and will sync automatically when back online.`);
      setOrderComplete({ id: offlineId, order_number: 'OFFLINE', payment_pending: true });
      return;
    }

    setSubmitting(true);
    setDuplicateWarning(null);
    try {
      const url = editId ? `/api/orders/${editId}` : '/api/orders';
      const method = editId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      
      if (res.status === 409 && !editId) {
        const data = await res.json();
        setDuplicateWarning(data);
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit');
      }
      
      const order = await res.json();
      if (editId) {
        router.push(`/orders/${editId}`);
      } else if (order.requires_online_payment) {
        const paymentResult = await handlePayOnline(order.id);
        setOrderComplete(paymentResult?.success ? order : { ...order, payment_pending: true });
      } else {
        setOrderComplete(order);
      }
    } catch (e) {
      alert('Order failed: ' + e.message);
    }
    setSubmitting(false);
  };

  return {
    submitting,
    orderComplete,
    setOrderComplete,
    duplicateWarning,
    setDuplicateWarning,
    handleSubmitOrder
  };
}
