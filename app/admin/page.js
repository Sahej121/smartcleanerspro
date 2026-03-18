'use client';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="loading-spinner"></div>;

  const formatCurrency = (v) => `₹${(v || 0).toLocaleString('en-IN')}`;

  // Build chart data for daily revenue
  const maxRevenue = Math.max(...(data?.dailyRevenue?.map(d => d.revenue) || [1]), 1);
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div id="admin-page">
      <div className="page-header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p>Business performance overview</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>{formatCurrency(data?.totalRevenue)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>{data?.totalOrders || 0}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>{formatCurrency(data?.avgOrderValue)}</h3>
            <p>Avg Order Value</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>{data?.avgTurnaround || 0} days</h3>
            <p>Avg Turnaround</p>
          </div>
        </div>
      </div>

      <div className="two-col-wide">
        {/* Revenue Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Revenue (Last 7 Days)</div>
          </div>
          <div className="chart-container">
            {data?.dailyRevenue?.map((d, i) => {
              const height = Math.max((d.revenue / maxRevenue) * 220, 8);
              const dayNum = new Date(d.day).getDay();
              return (
                <div
                  key={i}
                  className="chart-bar"
                  style={{ height: `${height}px` }}
                  data-label={dayLabels[dayNum]}
                  title={`${formatCurrency(d.revenue)} (${d.order_count} orders)`}
                />
              );
            })}
            {(!data?.dailyRevenue || data.dailyRevenue.length === 0) && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                No revenue data yet
              </div>
            )}
          </div>
        </div>

        {/* Order Status */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Orders by Status</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.ordersByStatus?.map(s => {
              const percentage = data.totalOrders > 0 ? Math.round((s.count / data.totalOrders) * 100) : 0;
              return (
                <div key={s.status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="text-sm font-semibold" style={{ textTransform: 'capitalize' }}>{s.status}</span>
                    <span className="text-sm text-muted">{s.count} ({percentage}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${percentage}%`,
                      background: s.status === 'delivered' ? 'var(--primary-500)' :
                                  s.status === 'ready' ? 'var(--primary-400)' :
                                  s.status === 'processing' ? 'var(--orange-500)' :
                                  s.status === 'received' ? 'var(--blue-500)' : 'var(--slate-400)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="two-col-wide" style={{ marginTop: '20px' }}>
        {/* Top Services */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top Services</div>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data?.topServices?.map(s => (
                  <tr key={s.service_type}>
                    <td style={{ fontWeight: 500 }}>{s.service_type}</td>
                    <td>{s.count}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{formatCurrency(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Garments */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top Garments</div>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Garment</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {data?.topGarments?.map(g => (
                  <tr key={g.garment_type}>
                    <td style={{ fontWeight: 500 }}>{g.garment_type}</td>
                    <td>{g.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <div className="card-title">Payment Methods</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {data?.paymentMethods?.map(pm => (
            <div key={pm.payment_method} style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, marginBottom: '8px', color: 'var(--primary-600)', background: 'var(--primary-50)', display: 'inline-block', padding: '2px 8px', borderRadius: '4px' }}>
                {pm.payment_method.toUpperCase()}
              </div>
              <div style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.5px' }}>
                {pm.payment_method}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>{formatCurrency(pm.total)}</div>
              <div className="text-sm text-muted">{pm.count} transactions</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
