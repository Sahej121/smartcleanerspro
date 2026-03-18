'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '', notes: '' });

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = () => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    fetch(`/api/customers${params}`)
      .then(r => r.json())
      .then(data => { setCustomers(data); setLoading(false); });
  };

  const handleCreate = async () => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer),
    });
    if (res.ok) {
      setShowModal(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '', notes: '' });
      fetchCustomers();
    }
  };

  return (
    <div id="customers-page">
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>Manage your customer database</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Add Customer
        </button>
      </div>

      <input
        className="form-input"
        placeholder="Search by name, phone, or email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ maxWidth: '400px', marginBottom: '24px' }}
      />

      {loading ? <div className="loading-spinner"></div> : (
        <div className="customer-grid">
          {customers.map(c => (
            <Link key={c.id} href={`/customers/${c.id}`}>
              <div className="customer-card">
                <div className="customer-avatar">{c.name.charAt(0)}</div>
                <div className="customer-info" style={{ flex: 1 }}>
                  <h3>{c.name}</h3>
                  <p>{c.phone}</p>
                  <div className="customer-meta">
                    <span style={{ fontSize: '12px', background: 'var(--blue-50)', color: 'var(--blue-600)', padding: '2px 6px', borderRadius: '4px' }}>ORDERS: {c.order_count || 0}</span>
                    <span style={{ fontSize: '12px', background: 'var(--primary-50)', color: 'var(--primary-600)', padding: '2px 6px', borderRadius: '4px' }}>PTS: {c.loyalty_points}</span>
                    <span style={{ fontSize: '12px', background: 'var(--green-50)', color: 'var(--green-600)', padding: '2px 6px', borderRadius: '4px' }}>SPENT: ₹{(c.total_spent || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Customer</h2>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} placeholder="Full name" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="+91-..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} placeholder="email@example.com" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} placeholder="Address" />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" value={newCustomer.notes} onChange={e => setNewCustomer({ ...newCustomer, notes: e.target.value })} placeholder="Special instructions, allergies, etc." rows={3} style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!newCustomer.name}>Create Customer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
