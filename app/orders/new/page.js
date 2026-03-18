'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STEPS = ['Customer', 'Garments', 'Review', 'Payment'];

export default function NewOrder() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(null);
  const [showAllItems, setShowAllItems] = useState(false);

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(setCustomers);
    fetch('/api/pricing').then(r => r.json()).then(setPricing);
  }, []);

  // Get unique garment types and service types from pricing
  const garmentTypes = [...new Set(pricing.map(p => p.garment_type))];
  const serviceTypes = [...new Set(pricing.map(p => p.service_type))];

  const getPrice = (garment, service) => {
    const p = pricing.find(x => x.garment_type === garment && x.service_type === service);
    return p ? p.price : 0;
  };

  const addToCart = (garment, service) => {
    const price = getPrice(garment, service);
    if (!price) return;
    const existing = cart.find(c => c.garment_type === garment && c.service_type === service);
    if (existing) {
      setCart(cart.map(c =>
        c.garment_type === garment && c.service_type === service
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, { garment_type: garment, service_type: service, price, quantity: 1 }]);
    }
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, qty) => {
    if (qty < 1) return removeFromCart(index);
    setCart(cart.map((c, i) => i === index ? { ...c, quantity: qty } : c));
  };

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const total = subtotal + tax;

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const handleCreateCustomer = async () => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer),
    });
    const customer = await res.json();
    setCustomers([customer, ...customers]);
    setSelectedCustomer(customer);
    setShowNewCustomer(false);
    setNewCustomer({ name: '', phone: '', email: '', address: '' });
  };

  const handleSubmitOrder = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer?.id,
          items: cart,
          payment_method: paymentMethod,
        }),
      });
      const order = await res.json();
      setOrderComplete(order);
    } catch (e) {
      alert('Error creating order');
    }
    setSubmitting(false);
  };

  if (orderComplete) {
    return (
      <div id="order-complete-page" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-600)', marginBottom: '16px', background: 'var(--primary-50)', display: 'inline-block', padding: '12px 24px', borderRadius: '40px' }}>SUCCESS</div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Order Created</h1>
        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          Order <strong style={{ color: 'var(--primary-600)' }}>{orderComplete.order_number}</strong>
        </p>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          {orderComplete.customer_name || 'Walk-in Customer'} • ₹{orderComplete.total_amount?.toLocaleString('en-IN')}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn btn-primary btn-lg" onClick={() => { setOrderComplete(null); setStep(0); setCart([]); setSelectedCustomer(null); }}>
            New Order
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => router.push(`/orders/${orderComplete.id}`)}>
            View Order
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => router.push('/orders')}>
            All Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="new-order-page">
      <div className="page-header">
        <div>
          <h1>Create New Order</h1>
          <p>Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>
      </div>

      <div className="order-steps">
        {STEPS.map((s, i) => (
          <div key={s} className={`order-step ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}>
            <div className="order-step-dot" onClick={() => i < step && setStep(i)}>
              {i < step ? '✓' : i + 1}
            </div>
            <div className="order-step-label">{s}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <div>
          {/* Step 0: Customer Selection */}
          {step === 0 && (
            <div className="card" id="customer-step">
              <div className="card-header">
                <div className="card-title">Select Customer</div>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowNewCustomer(true)}>
                  New Customer
                </button>
              </div>

              {showNewCustomer && (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>New Customer</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Name *</label>
                      <input className="form-input" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} placeholder="Customer name" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Phone *</label>
                      <input className="form-input" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="+91-..." />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Email</label>
                      <input className="form-input" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} placeholder="Email" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Address</label>
                      <input className="form-input" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} placeholder="Address" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <button className="btn btn-primary btn-sm" onClick={handleCreateCustomer} disabled={!newCustomer.name}>Create & Select</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowNewCustomer(false)}>Cancel</button>
                  </div>
                </div>
              )}

              <input
                className="form-input"
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ marginBottom: '16px' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                {filteredCustomers.map(c => (
                  <div
                    key={c.id}
                    className="customer-card"
                    onClick={() => { setSelectedCustomer(c); setStep(1); }}
                    style={{
                      border: selectedCustomer?.id === c.id ? '2px solid var(--primary-500)' : undefined,
                      background: selectedCustomer?.id === c.id ? 'var(--primary-50)' : undefined,
                    }}
                  >
                    <div className="customer-avatar">{c.name.charAt(0)}</div>
                    <div className="customer-info">
                      <h3>{c.name}</h3>
                      <p>{c.phone}</p>
                      <div className="customer-meta">
                        <span style={{ fontSize: '12px', background: 'var(--primary-100)', color: 'var(--primary-700)', padding: '2px 6px', borderRadius: '4px' }}>LOYALTY: {c.loyalty_points}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Garment & Service Selection */}
          {step === 1 && (
            <div className="card" id="garment-step">
              <div className="card-title" style={{ marginBottom: '20px' }}>Select Garments & Services</div>
              <p className="text-muted text-sm" style={{ marginBottom: '16px' }}>
                Click a garment, then select a service to add to the order.
              </p>

              {garmentTypes.map(garment => (
                <div key={garment} style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {garment}
                  </h3>
                  <div className="service-chips">
                    {serviceTypes.map(service => {
                      const price = getPrice(garment, service);
                      if (!price) return null;
                      const inCart = cart.find(c => c.garment_type === garment && c.service_type === service);
                      return (
                        <button
                          key={service}
                          className={`service-chip ${inCart ? 'selected' : ''}`}
                          onClick={() => addToCart(garment, service)}
                        >
                          {service} – ₹{price}
                          {inCart && ` (${inCart.quantity})`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="card" id="review-step">
              <div className="card-title" style={{ marginBottom: '20px' }}>Review Order</div>
              {cart.length === 0 ? (
                <div className="empty-state">
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '12px' }}>CART IS EMPTY</div>
                  <h3 style={{ fontSize: '16px' }}>No items added</h3>
                  <p>Go back and add garments to your order.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Garment</th>
                        <th>Service</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, i) => (
                        <tr key={i}>
                          <td>
                            {item.garment_type}
                          </td>
                          <td>{item.service_type}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => updateQuantity(i, item.quantity - 1)}>−</button>
                              <span style={{ fontWeight: 600, width: '24px', textAlign: 'center' }}>{item.quantity}</span>
                              <button className="btn btn-ghost btn-sm" onClick={() => updateQuantity(i, item.quantity + 1)}>+</button>
                            </div>
                          </td>
                          <td>₹{item.price}</td>
                          <td style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                          <td>
                            <button className="btn btn-ghost btn-sm" onClick={() => removeFromCart(i)} style={{ color: 'var(--red-500)' }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="card" id="payment-step">
              <div className="card-title" style={{ marginBottom: '20px' }}>Payment Method</div>
              <div className="payment-options">
                {[
                  { id: 'cash', label: 'Cash', code: 'CASH' },
                  { id: 'card', label: 'Card', code: 'CARD' },
                  { id: 'upi', label: 'UPI', code: 'UPI' },
                  { id: 'online', label: 'Online', code: 'NET' },
                ].map(pm => (
                  <div
                    key={pm.id}
                    className={`payment-option ${paymentMethod === pm.id ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod(pm.id)}
                  >
                    <div className="payment-option-icon" style={{ fontSize: '10px', fontWeight: 700 }}>{pm.code}</div>
                    <div className="payment-option-label">{pm.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="order-summary">
          <div className="order-summary-title">Order Summary</div>
          {selectedCustomer && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div className="customer-avatar" style={{ width: '36px', height: '36px', fontSize: '14px' }}>{selectedCustomer.name.charAt(0)}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{selectedCustomer.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedCustomer.phone}</div>
              </div>
            </div>
          )}

          {cart.length === 0 ? (
            <p className="text-muted text-sm" style={{ padding: '20px 0', textAlign: 'center' }}>No items added yet</p>
          ) : (
            <>
              {cart.slice(0, showAllItems ? cart.length : 5).map((item, i) => (
                <div key={i} className="order-summary-item">
                  <div style={{ flex: 1 }}>
                    <div className="order-summary-item-name">{item.garment_type} × {item.quantity}</div>
                    <div className="order-summary-item-service">{item.service_type}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="order-summary-item-price">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                    <button 
                      className="btn btn-ghost btn-icon" 
                      onClick={() => removeFromCart(i)}
                      style={{ width: '24px', height: '24px', padding: 0, color: 'var(--red-500)', fontSize: '12px' }}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              
              {cart.length > 5 && (
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={() => setShowAllItems(!showAllItems)}
                  style={{ width: '100%', marginTop: '4px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                >
                  {showAllItems ? 'Show Less' : `Show ${cart.length - 5} More`}
                </button>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span>GST (18%)</span>
                <span>₹{tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="order-summary-total">
                <span>Total</span>
                <span style={{ color: 'var(--primary-700)' }}>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            {step > 0 && (
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(step - 1)}>
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => setStep(step + 1)}
                disabled={step === 0 && !selectedCustomer || step === 1 && cart.length === 0}
              >
                Next
              </button>
            ) : (
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleSubmitOrder}
                disabled={submitting || cart.length === 0}
              >
                {submitting ? 'Creating...' : `Pay ₹${total.toLocaleString('en-IN')}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
