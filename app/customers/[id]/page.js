'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function CustomerDetail({ params }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then(r => r.json())
      .then(data => { setCustomer(data); setLoading(false); });
  }, [id]);

  if (loading) return <div className="loading-spinner"></div>;
  if (!customer) return <div className="empty-state"><h3>Customer not found</h3></div>;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div id="customer-detail-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/customers" className="btn btn-ghost btn-sm">← Back</Link>
          <div className="customer-avatar" style={{ width: '52px', height: '52px', fontSize: '22px' }}>{customer.name.charAt(0)}</div>
          <div>
            <h1>{customer.name}</h1>
            <p>{customer.phone} {customer.email && `• ${customer.email}`}</p>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon green">📦</div>
          <div className="stat-info">
            <h3>{customer.order_count || 0}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"></div>
          <div className="stat-info">
            <h3>₹{(customer.total_spent || 0).toLocaleString('en-IN')}</h3>
            <p>Total Spent</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">🏆</div>
          <div className="stat-info">
            <h3>{customer.loyalty_points}</h3>
            <p>Loyalty Points</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">📅</div>
          <div className="stat-info">
            <h3>{formatDate(customer.created_at)}</h3>
            <p>Customer Since</p>
          </div>
        </div>
      </div>

      {customer.notes && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-title" style={{ marginBottom: '8px' }}>📝 Notes</div>
          <p className="text-muted">{customer.notes}</p>
        </div>
      )}

      {customer.address && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-title" style={{ marginBottom: '8px' }}>📍 Address</div>
          <p className="text-muted">{customer.address}</p>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Order History</div>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customer.orders?.length === 0 ? (
                <tr><td colSpan="6"><div className="empty-state"><p>No orders yet</p></div></td></tr>
              ) : customer.orders?.map(o => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/orders/${o.id}`} style={{ color: 'var(--primary-600)', fontWeight: 600 }}>
                      {o.order_number}
                    </Link>
                  </td>
                  <td>{o.item_count} items</td>
                  <td style={{ fontWeight: 600 }}>₹{o.total_amount?.toLocaleString('en-IN')}</td>
                  <td><span className={`badge badge-${o.status}`}>{o.status}</span></td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatDate(o.created_at)}</td>
                  <td><Link href={`/orders/${o.id}`} className="btn btn-ghost btn-sm">View →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
