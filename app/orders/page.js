'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const STATUS_TABS = ['all', 'received', 'processing', 'ready', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [activeTab, search]);

  const fetchOrders = () => {
    const params = new URLSearchParams();
    if (activeTab !== 'all') params.set('status', activeTab);
    if (search) params.set('search', search);

    fetch(`/api/orders?${params}`)
      .then(r => r.json())
      .then(data => { setOrders(data); setLoading(false); });
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const tabCounts = {};
  if (orders.length > 0) {
    STATUS_TABS.forEach(t => {
      tabCounts[t] = t === 'all' ? orders.length : orders.filter(o => o.status === t).length;
    });
  }

  return (
    <div id="orders-page">
      <div className="page-header">
        <div>
          <h1>Orders</h1>
          <p>Manage and track all customer orders</p>
        </div>
        <Link href="/orders/new" className="btn btn-primary">
          New Order
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
        <input
          className="form-input"
          placeholder="Search by order #, customer name, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '360px' }}
        />
      </div>

      <div className="tabs">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-spinner"></div> : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h3>No orders found</h3>
                        <p>Try adjusting your filters or create a new order.</p>
                      </div>
                    </td>
                  </tr>
                ) : orders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/orders/${order.id}`} style={{ color: 'var(--primary-600)', fontWeight: 600 }}>
                        {order.order_number}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 500 }}>{order.customer_name || 'Walk-in'}</div>
                        {order.customer_phone && <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{order.customer_phone}</div>}
                      </div>
                    </td>
                    <td>{order.item_count} items</td>
                    <td style={{ fontWeight: 600 }}>₹{order.total_amount?.toLocaleString('en-IN')}</td>
                    <td><span className={`badge badge-${order.payment_status}`}>{order.payment_status}</span></td>
                    <td><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatDate(order.created_at)}</td>
                    <td>
                      <Link href={`/orders/${order.id}`} className="btn btn-ghost btn-sm">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
