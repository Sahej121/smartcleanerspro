'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useUser, ROLES } from '@/lib/UserContext';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [masterStats, setMasterStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for creating new client stores
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStore, setNewStore] = useState({ store_name: '', city: '', admin_name: '', admin_email: '', admin_phone: '' });
  const [credentialsModal, setCredentialsModal] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const { t } = useLanguage();
  const { role, user } = useUser();

  const fetchData = async () => {
    try {
      if (role === ROLES.OWNER) {
        const res = await fetch('/api/master-stats');
        const data = await res.json();
        setMasterStats(data);
      } else {
        const res = await fetch('/api/stats');
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role]);

  const handleCreateStore = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStore),
      });
      if (res.ok) {
        const data = await res.json();
        setShowCreateModal(false);
        setNewStore({ store_name: '', city: '', admin_name: '', admin_email: '', admin_phone: '' });
        setCredentialsModal({ storeName: data.store_name, email: data.admin_email, password: data.tempPassword });
        fetchData(); // Refresh the master stats
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to provision store');
      }
    } catch (e) {
      console.error(e);
      alert('An internal error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // ==== OWNER MASTER CONTROL DASHBOARD ====
  if (role === ROLES.OWNER) {
    return (
      <div className="animate-fade-in">
        <div className="dashboard-header mb-24">
          <div>
            <h1 className="page-title">Master Control Overview</h1>
            <p className="text-muted">Global performance across all systems and stores.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => window.location.href='/admin/settings'}>
              System Settings
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              Create New Store
            </button>
          </div>
        </div>

        {/* Global SaaS Metrics */}
        <div className="stats-grid mb-24">
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-title">Monthly Rec. Revenue (MRR)</div>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--primary-600)' }}>₹{masterStats?.mrr?.toLocaleString() || 0}</div>
            <div className="stat-card-trend trend-up">↑ 12% from last month</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-title">Global Revenue (All Time)</div>
            </div>
            <div className="stat-card-value">₹{masterStats?.globalRevenue?.toLocaleString() || 0}</div>
            <div className="stat-card-trend trend-up">Combined Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-title">System Health</div>
            </div>
            <div className="stat-card-value" style={{ fontSize: '20px', color: 'var(--emerald-600)' }}>{masterStats?.systemHealth || 'Online'}</div>
            <div className="stat-card-trend trend-neutral">All nodes operational</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-title">Churn Rate</div>
            </div>
            <div className="stat-card-value">{masterStats?.churn || 0}%</div>
            <div className="stat-card-trend trend-down">↓ 0.2% improvement</div>
          </div>
        </div>

        <div className="stats-grid mb-24" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="stat-card">
            <div className="stat-card-header"><div className="stat-card-title">Active Stores</div></div>
            <div className="stat-card-value">{masterStats?.totalStores || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header"><div className="stat-card-title">Total System Users</div></div>
            <div className="stat-card-value">{masterStats?.totalUsers || 0}</div>
          </div>
        </div>

        {/* Store Performance List */}
        <div className="card">
          <div className="card-header pb-16" style={{ borderBottom: '1px solid var(--border-light)', marginBottom: '16px' }}>
            <h2 className="card-title">System Instances & Store Performance</h2>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Store Name</th>
                  <th>Location</th>
                  <th>Subscription</th>
                  <th>Since</th>
                  <th>Revenue</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {masterStats?.stores?.map((store) => (
                  <tr key={store.id}>
                    <td style={{ fontWeight: 600 }}>
                      {store.store_name}
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 400 }}>ID: #{store.id}</div>
                    </td>
                    <td>{store.city}</td>
                    <td>
                      <span className={`badge badge-${store.subscription_status === 'paid' ? 'success' : 'processing'}`} style={{ fontSize: '10px' }}>
                        {store.subscription_status?.toUpperCase() || 'TRIAL'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(store.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>₹{store.revenue.toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${store.status === 'active' ? 'success' : 'processing'}`}>
                        {store.status?.toUpperCase() || 'ACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          title="Impersonate Admin"
                          onClick={async () => {
                            const res = await fetch(`/api/stores/${store.id}/impersonate`, { method: 'POST' });
                            if (res.ok) window.location.href = '/';
                          }}
                        >
                          👤
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          style={{ color: store.status === 'active' ? 'var(--red-500)' : 'var(--emerald-500)' }}
                          title={store.status === 'active' ? 'Suspend Store' : 'Activate Store'}
                          onClick={async () => {
                            const newStatus = store.status === 'active' ? 'suspended' : 'active';
                            await fetch(`/api/stores/${store.id}/status`, { 
                              method: 'POST', 
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: newStatus })
                            });
                            fetchData();
                          }}
                        >
                          {store.status === 'active' ? '🚫' : '✅'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MODALS --- */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h2>Provision New Store Tenant</h2>
                <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '15px', color: 'var(--primary-600)', marginBottom: '12px' }}>1. Store Information</h3>
                  <div className="form-group">
                    <label className="form-label">Store / Client Name *</label>
                    <input className="form-input" value={newStore.store_name} onChange={e => setNewStore({ ...newStore, store_name: e.target.value })} placeholder="e.g. Dry Clean Pro USA" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City / Location *</label>
                    <input className="form-input" value={newStore.city} onChange={e => setNewStore({ ...newStore, city: e.target.value })} placeholder="e.g. New York" />
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '15px', color: 'var(--primary-600)', marginBottom: '12px' }}>2. Client Admin Credentials</h3>
                  <div className="form-group">
                    <label className="form-label">Admin Full Name *</label>
                    <input className="form-input" value={newStore.admin_name} onChange={e => setNewStore({ ...newStore, admin_name: e.target.value })} placeholder="e.g. John Doe" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Admin Email *</label>
                      <input className="form-input" value={newStore.admin_email} onChange={e => setNewStore({ ...newStore, admin_email: e.target.value })} placeholder="admin@client.com" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Admin Phone</label>
                      <input className="form-input" value={newStore.admin_phone} onChange={e => setNewStore({ ...newStore, admin_phone: e.target.value })} placeholder="+1-..." />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreateStore} disabled={!newStore.store_name || !newStore.city || !newStore.admin_name || !newStore.admin_email || isCreating}>
                  {isCreating ? 'Provisioning...' : 'Provision Store & Automate Pricing'}
                </button>
              </div>
            </div>
          </div>
        )}

        {credentialsModal && (
          <div className="modal-overlay" onClick={() => setCredentialsModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Client Environment Provisioned</h2>
                <button className="btn btn-ghost" onClick={() => setCredentialsModal(null)}>✕</button>
              </div>
              <div className="modal-body" style={{ textAlign: 'center', padding: '32px 16px' }}>
                <h3 style={{ marginBottom: '8px' }}>{credentialsModal.storeName} is Live!</h3>
                <p className="text-muted" style={{ marginBottom: '24px' }}>The store has been provisioned. We automatically seeded it with standard pricing sheets and inventory levels. Share these Admin credentials securely with your client.</p>
                
                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', textAlign: 'left', fontFamily: 'monospace', fontSize: '16px' }}>
                  <div style={{ marginBottom: '8px' }}><strong>Admin Email:</strong> {credentialsModal.email}</div>
                  <div><strong>Temporary Password:</strong> <span style={{ color: 'var(--primary-600)', fontWeight: 'bold' }}>{credentialsModal.password}</span></div>
                </div>
              </div>
              <div className="modal-footer" style={{ justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => setCredentialsModal(null)}>I have copied the credentials</button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ==== STANDARD STAFF/ADMIN DASHBOARD ====
  const formatCurrency = (val) => `₹${(val || 0).toLocaleString('en-IN')}`;

  return (
    <div id="dashboard-page">
      <div className="page-header">
        <div>
          <h1>{t('nav_dashboard')}</h1>
          <p>{t('dash_welcome')}</p>
        </div>
        <Link href="/orders/new" className="btn btn-primary btn-lg" id="new-order-btn">
          {t('dash_create_order')}
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>{stats?.todayOrders || 0}</h3>
            <p>{t('dash_today_orders')}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>{formatCurrency(stats?.todayRevenue)}</h3>
            <p>{t('dash_today_revenue')}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>{stats?.pendingPickup || 0}</h3>
            <p>{t('dash_ready_pickup')}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>{stats?.activeGarments || 0}</h3>
            <p>{t('dash_active_garments')}</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <Link href="/orders/new" className="quick-action-btn">
          <div className="quick-action-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)', fontSize: '12px', fontWeight: 600 }}>NEW</div>
          {t('create_new_order')}
        </Link>
        <Link href="/customers" className="quick-action-btn">
          <div className="quick-action-icon" style={{ background: 'var(--blue-50)', color: 'var(--blue-500)', fontSize: '12px', fontWeight: 600 }}>USER</div>
          {t('dash_customer_lookup')}
        </Link>
        <Link href="/operations" className="quick-action-btn">
          <div className="quick-action-icon" style={{ background: 'var(--orange-50)', color: 'var(--orange-500)', fontSize: '12px', fontWeight: 600 }}>OPS</div>
          {t('dash_ops_board')}
        </Link>
        <Link href="/admin" className="quick-action-btn">
          <div className="quick-action-icon" style={{ background: 'var(--purple-50)', color: 'var(--purple-500)', fontSize: '12px', fontWeight: 600 }}>DATA</div>
          {t('dash_view_analytics')}
        </Link>
      </div>

      <div className="two-col-wide">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{t('dash_recent_orders')}</div>
              <div className="card-subtitle">{t('dash_latest_orders')}</div>
            </div>
            <Link href="/orders" className="btn btn-ghost btn-sm">{t('dash_view_all')}</Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('order_num')}</th>
                  <th>{t('customer')}</th>
                  <th>{t('items')}</th>
                  <th>{t('total')}</th>
                  <th>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentOrders?.map(order => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/orders/${order.id}`} style={{ color: 'var(--primary-600)', fontWeight: 600 }}>
                        {order.order_number}
                      </Link>
                    </td>
                    <td>{order.customer_name || t('walkin')}</td>
                    <td>{order.item_count} {t('items').toLowerCase()}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(order.total_amount)}</td>
                    <td><span className={`badge badge-${order.status}`}>{t(order.status) || order.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: '16px' }}>{t('dash_quick_stats')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted text-sm">{t('dash_total_customers')}</span>
                <span className="font-semibold">{stats?.totalCustomers || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted text-sm">{t('dash_total_orders')}</span>
                <span className="font-semibold">{stats?.totalOrders || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted text-sm">{t('dash_total_revenue')}</span>
                <span className="font-semibold">{formatCurrency(stats?.totalRevenue)}</span>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: '16px' }}>{t('dash_inventory_alerts')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'var(--yellow-50)',borderRadius:'var(--radius-md)'}}>
                <span style={{fontSize:'13px',fontWeight:500}}>Steam Press 2</span>
                <span className="badge badge-processing">{t('dash_maintenance')}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'var(--bg-secondary)',borderRadius:'var(--radius-md)'}}>
                <span style={{fontSize:'13px',fontWeight:500}}>Stain Remover</span>
                <span style={{fontSize:'12px',color:'var(--orange-500)',fontWeight:600}}>{t('dash_low_stock')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
