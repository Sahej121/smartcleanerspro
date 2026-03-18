'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

const STAGE_LABELS = {
  received: 'Received', sorting: 'Sorting', washing: 'Washing',
  dry_cleaning: 'Dry Cleaning', drying: 'Drying', ironing: 'Ironing',
  quality_check: 'Quality Check', ready: 'Ready', delivered: 'Delivered',
};

export default function OrderDetail({ params }) {
  const { id } = use(params);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(data => { setOrder(data); setLoading(false); });
  }, [id]);

  const updateStatus = async (status) => {
    await fetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setOrder({ ...order, status });
  };

  if (loading) return <div className="loading-spinner"></div>;
  if (!order) return <div className="empty-state"><h3>Order not found</h3></div>;

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div id="order-detail-page">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/orders" className="btn btn-ghost btn-sm">← Back</Link>
            <h1>Order {order.order_number}</h1>
            <span className={`badge badge-${order.status}`} style={{ fontSize: '14px', padding: '6px 14px' }}>
              {order.status}
            </span>
          </div>
          <p style={{ marginLeft: '76px' }}>Created {formatDate(order.created_at)}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {order.status === 'received' && (
            <button className="btn btn-primary btn-sm" onClick={() => updateStatus('processing')}>
              Start Processing
            </button>
          )}
          {order.status === 'ready' && (
            <button className="btn btn-primary btn-sm" onClick={() => updateStatus('delivered')}>
              Mark Delivered
            </button>
          )}
        </div>
      </div>

      <div className="two-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Items */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '16px' }}>Order Items</div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Service</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.garment_type}</td>
                      <td>{item.service_type}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.price?.toLocaleString('en-IN')}</td>
                      <td><span className={`badge badge-${item.status}`}>{STAGE_LABELS[item.status] || item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '16px' }}>Workflow Timeline</div>
            {order.items?.map(item => {
              const history = item.workflow_history ? item.workflow_history.split('|').map(h => {
                const [stage, time] = h.split(':');
                return { stage, time };
              }) : [];
              return (
                <div key={item.id} style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>
                    {item.garment_type} – {item.service_type}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {history.map((h, i) => (
                      <span key={i} className={`badge badge-${h.stage}`} style={{ fontSize: '11px' }}>
                        {STAGE_LABELS[h.stage] || h.stage}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Customer */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '16px' }}>Customer</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div className="customer-avatar">{(order.customer_name || 'W').charAt(0)}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{order.customer_name || 'Walk-in Customer'}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{order.customer_phone || '—'}</div>
              </div>
            </div>
            {order.customer_email && <p className="text-sm text-muted">{order.customer_email}</p>}
            {order.customer_address && <p className="text-sm text-muted">{order.customer_address}</p>}
          </div>

          {/* Payment */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '16px' }}>Payment</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted text-sm">Subtotal</span>
                <span>₹{((order.total_amount || 0) - (order.tax || 0)).toLocaleString('en-IN')}</span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted text-sm">Discount</span>
                  <span style={{ color: 'var(--primary-600)' }}>-₹{order.discount?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted text-sm">Tax (GST)</span>
                <span>₹{order.tax?.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '2px solid var(--border-color)', fontWeight: 700, fontSize: '18px' }}>
                <span>Total</span>
                <span style={{ color: 'var(--primary-700)' }}>₹{order.total_amount?.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <span className="text-muted text-sm">Method</span>
                <span className="font-semibold" style={{ textTransform: 'uppercase' }}>{order.payment_method}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted text-sm">Status</span>
                <span className={`badge badge-${order.payment_status}`}>{order.payment_status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
