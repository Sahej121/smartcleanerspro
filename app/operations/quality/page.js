'use client';
import { useState, useEffect } from 'react';

export default function QualityControlPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = () => {
    fetch('/api/workflow')
      .then(r => r.json())
      .then(data => {
        setItems(data.quality_check || []);
        setLoading(false);
      });
  };

  const handleAction = async (itemId, action) => {
    await fetch(`/api/workflow/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    fetchItems();
  };

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div id="quality-page" className="p-4 lg:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="page-header">
        <div>
          <h1>Quality Control</h1>
          <p>Review garments at the quality check stage</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchItems}>🔄 Refresh</button>
      </div>

      {items.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <h3>All Clear!</h3>
            <p>No garments pending quality inspection right now.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {items.map(item => (
            <div key={item.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--primary-600)', fontWeight: 600, marginBottom: '4px' }}>{item.order_number}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{item.garment_type}</div>
                  <div className="text-sm text-muted">{item.service_type}</div>
                </div>
                <span className="badge badge-quality_check">QC Pending</span>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                <div className="text-sm" style={{ fontWeight: 500, marginBottom: '4px' }}>Customer</div>
                <div className="text-sm text-muted">{item.customer_name || 'Walk-in'}</div>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                <strong>Checklist:</strong>
                <ul style={{ marginTop: '6px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Stains fully removed</li>
                  <li>No fabric damage</li>
                  <li>Ironing quality acceptable</li>
                  <li>Proper folding/hanging</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => handleAction(item.id, 'advance')}
                >
                  ✅ Approve
                </button>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  onClick={() => handleAction(item.id, 'reject')}
                >
                  ↩️ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
