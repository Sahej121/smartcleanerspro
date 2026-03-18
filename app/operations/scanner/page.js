'use client';
import { useState } from 'react';

const STAGE_LABELS = {
  received: 'Received', sorting: 'Sorting', washing: 'Washing',
  dry_cleaning: 'Dry Cleaning', drying: 'Drying', ironing: 'Ironing',
  quality_check: 'Quality Check', ready: 'Ready', delivered: 'Delivered',
};

export default function ScannerPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      // Search by order number or item ID
      const res = await fetch(`/api/orders?search=${encodeURIComponent(query)}`);
      const orders = await res.json();
      
      if (orders.length > 0) {
        // Get detail for first matching order
        const detailRes = await fetch(`/api/orders/${orders[0].id}`);
        const detail = await detailRes.json();
        setResults(detail);
      } else {
        setResults(null);
        setMessage('No orders found for this search.');
      }
    } catch {
      setMessage('Error searching. Please try again.');
    }
    setLoading(false);
  };

  const advanceItem = async (itemId) => {
    const res = await fetch(`/api/workflow/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'advance' }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage(`✅ Item moved to: ${STAGE_LABELS[data.newStage]}`);
      // Refresh
      handleSearch();
    }
  };

  return (
    <div id="scanner-page">
      <div className="page-header">
        <div>
          <h1>Garment Scanner</h1>
          <p>Look up garments by order number or scan QR code</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <input
            className="form-input"
            placeholder="Enter order number (e.g., CF-1001) or scan barcode..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ flex: 1, fontSize: '16px', padding: '14px 18px' }}
          />
          <button className="btn btn-primary btn-lg" onClick={handleSearch} disabled={loading}>
            {loading ? '...' : '🔍 Search'}
          </button>
        </div>

        {message && (
          <div style={{
            padding: '12px 16px',
            background: message.includes('✅') ? 'var(--primary-50)' : 'var(--yellow-50)',
            borderRadius: 'var(--radius-md)',
            color: message.includes('✅') ? 'var(--primary-700)' : 'var(--yellow-500)',
            fontWeight: 500,
            fontSize: '14px',
            marginBottom: '20px',
          }}>
            {message}
          </div>
        )}

        {results && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--primary-600)' }}>{results.order_number}</div>
                <div className="text-muted text-sm">{results.customer_name || 'Walk-in'} • {results.customer_phone || '—'}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span className={`badge badge-${results.status}`} style={{ fontSize: '14px', padding: '6px 14px' }}>{results.status}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {results.items?.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.garment_type}</div>
                    <div className="text-sm text-muted">{item.service_type}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`badge badge-${item.status}`}>{STAGE_LABELS[item.status]}</span>
                    {!['ready', 'delivered'].includes(item.status) && (
                      <button className="btn btn-primary btn-sm" onClick={() => advanceItem(item.id)}>
                        → Next Stage
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!results && !message && (
          <div className="empty-state">
            <div className="empty-state-icon">📱</div>
            <h3>Scan or Search</h3>
            <p>Enter an order number or scan a garment QR code to look up items and update their processing stage.</p>
          </div>
        )}
      </div>
    </div>
  );
}
