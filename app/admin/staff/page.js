'use client';
import { useState, useEffect } from 'react';

const ROLES = ['owner', 'manager', 'frontdesk', 'staff', 'driver'];
const ROLE_COLORS = {
  owner: 'var(--purple-500)', manager: 'var(--blue-500)', frontdesk: 'var(--primary-600)',
  staff: 'var(--orange-500)', driver: 'var(--slate-500)',
};

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', phone: '', role: 'staff' });
  
  // State for newly created user credentials
  const [credentialsModal, setCredentialsModal] = useState(null);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (!credentialsModal) return;
    const text = `Email: ${credentialsModal.email}\nPassword: ${credentialsModal.password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  useEffect(() => {
    fetch('/api/staff').then(r => r.json()).then(d => { setStaff(d); setLoading(false); });
  }, []);

  const handleCreate = async () => {
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStaff),
    });
    if (res.ok) {
      const user = await res.json();
      
      // Remove tempPassword before putting in table state
      const { tempPassword, ...userWithoutPassword } = user;
      
      setStaff([userWithoutPassword, ...staff]);
      setShowModal(false);
      setNewStaff({ name: '', email: '', phone: '', role: 'staff' });
      
      // Show credentials to the admin
      setCredentialsModal({ email: user.email, password: tempPassword, name: user.name });
    }
  };

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div id="staff-page" className="p-4 lg:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="page-header">
        <div>
          <h1>Staff Management</h1>
          <p>Manage your team members</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Add Staff
        </button>
      </div>

      <div className="stats-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {ROLES.map(role => {
          const count = staff.filter(s => s.role === role).length;
          return (
            <div key={role} className="stat-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{count}</div>
              <div style={{ fontSize: '12px', color: ROLE_COLORS[role], fontWeight: 600, textTransform: 'capitalize' }}>{role}</div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container overflow-x-auto" style={{ border: 'none' }}>
          <table className="table min-w-[600px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Store</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="customer-avatar" style={{ width: '34px', height: '34px', fontSize: '13px' }}>{s.name.charAt(0)}</div>
                      <span style={{ fontWeight: 500 }}>{s.name}</span>
                    </div>
                  </td>
                  <td className="text-muted">{s.email || '—'}</td>
                  <td className="text-muted">{s.phone || '—'}</td>
                  <td>
                    <span className="badge" style={{ background: `${ROLE_COLORS[s.role]}15`, color: ROLE_COLORS[s.role] }}>
                      {s.role}
                    </span>
                  </td>
                  <td className="text-muted">{s.store_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Staff Member</h2>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} placeholder="Full name" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} placeholder="email@cleanflow.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={newStaff.phone} onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })} placeholder="+91-..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!newStaff.name}>Add Member</button>
            </div>
          </div>
        </div>
      )}

      {credentialsModal && (
        <div className="modal-overlay" onClick={() => setCredentialsModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Staff Member Added</h2>
              <button className="btn btn-ghost" onClick={() => setCredentialsModal(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '32px 16px' }}>
              <h3 style={{ marginBottom: '8px' }}>{credentialsModal.name} has been added!</h3>
              <p className="text-muted" style={{ marginBottom: '24px' }}>Please copy these credentials and share them securely with the new team member. They will need this password to log in.</p>
              
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', textAlign: 'left', fontFamily: 'monospace', fontSize: '16px' }}>
                <div style={{ marginBottom: '8px' }}><strong>Email:</strong> {credentialsModal.email}</div>
                <div><strong>Password:</strong> <span style={{ color: 'var(--primary-600)', fontWeight: 'bold' }}>{credentialsModal.password}</span></div>
              </div>
              
              <button 
                className="btn btn-secondary" 
                onClick={() => copyToClipboard(`${credentialsModal.email}\n${credentialsModal.password}`)}
                style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
              >
                {copied ? 'Copied' : 'Copy Credentials'}
              </button>
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
