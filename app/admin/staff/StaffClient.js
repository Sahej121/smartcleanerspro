'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useUser, ROLES as USER_ROLES } from '@/lib/UserContext';

const ROLES = ['owner', 'manager', 'frontdesk', 'staff', 'driver'];
const ROLE_COLORS = {
  owner: 'var(--purple-500)', manager: 'var(--blue-500)', frontdesk: 'var(--primary-600)',
  staff: 'var(--orange-500)', driver: 'var(--slate-500)',
};

export default function StaffClient({ initialStaff }) {
  const { t } = useLanguage();
  const { role: userRole } = useUser();
  const [staff, setStaff] = useState(initialStaff);
  const [showModal, setShowModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', phone: '', role: 'staff' });
  const [credentialsModal, setCredentialsModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (!credentialsModal) return;
    const text = `Email: ${credentialsModal.email}\nPIN: ${credentialsModal.pin}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleCreate = async () => {
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStaff),
    });
    if (res.ok) {
      const user = await res.json();
      const { tempPassword, pin, ...userWithoutSecrets } = user;
      setStaff([userWithoutSecrets, ...staff]);
      setShowModal(false);
      setNewStaff({ name: '', email: '', phone: '', role: 'staff' });
      setCredentialsModal({ email: user.email, pin, name: user.name });
    }
  };

  const handleUpdate = async () => {
    if (!editModal) return;
    const res = await fetch('/api/staff', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editModal),
    });
    if (res.ok) {
      const updated = await res.json();
      setStaff(staff.map(s => s.id === updated.id ? { ...s, ...updated } : s));
      setEditModal(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('confirm_delete_staff'))) return;
    const res = await fetch(`/api/staff?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setStaff(staff.filter(s => s.id !== id));
    }
  };

  const handleResetPin = async (member) => {
    if (!confirm(t('confirm_reset_pin').replace('{name}', member.name))) return;
    const res = await fetch('/api/staff', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: member.id, regeneratePin: true }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCredentialsModal({ email: updated.email, pin: updated.pin, name: updated.name, type: 'reset' });
    }
  };

  return (
    <div id="staff-page" className="p-4 lg:p-8 max-w-7xl mx-auto min-h-screen animate-page-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="reveal reveal-left">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-outfit mb-2">
            {t('staff_management')}
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            {t('staff_management_desc')}
          </p>
        </div>
        
        {/* Only show Add Staff button for Owners and Managers */}
        {[USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN].includes(userRole) && (
          <button 
            className="reveal reveal-right primary-gradient text-white px-10 py-5 rounded-[1.5rem] text-sm font-black shadow-xl shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3"
            onClick={() => setShowModal(true)}
          >
            <span className="material-symbols-outlined font-bold">person_add</span>
            {t('add_staff')}
          </button>
        )}
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
                <th>{t('name')}</th>
                <th>{t('email')}</th>
                <th>{t('phone')}</th>
                <th>{t('role')}</th>
                <th>{t('store')}</th>
                <th style={{ textAlign: 'right' }}>{t('actions')}</th>
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
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => handleResetPin(s)} title="Reset PIN">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock_reset</span>
                      </button>
                      <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => setEditModal(s)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                      </button>
                      <button className="btn btn-ghost" style={{ padding: '6px', color: 'var(--red-500)' }} onClick={() => handleDelete(s.id)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                      </button>
                    </div>
                  </td>
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
              <h2>{t('add_staff_member')}</h2>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} placeholder={t('full_name_placeholder')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">{t('email')}</label>
                  <input className="form-input" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} placeholder="email@cleanflow.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('phone')}</label>
                  <input className="form-input" value={newStaff.phone} onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })} placeholder="+91-..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('role')}</label>
                <select className="form-select" value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('cancel')}</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!newStaff.name}>{t('add_member')}</button>
            </div>
          </div>
        </div>
      )}

      {credentialsModal && (
        <div className="modal-overlay" onClick={() => setCredentialsModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{credentialsModal.type === 'reset' ? t('pin_regenerated') : t('staff_member_added')}</h2>
              <button className="btn btn-ghost" onClick={() => setCredentialsModal(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '32px 16px' }}>
              <h3 style={{ marginBottom: '8px' }}>{credentialsModal.type === 'reset' ? `${t('new_pin_for')} ${credentialsModal.name}` : `${credentialsModal.name} ${t('has_been_added')}`}</h3>
              <p className="text-muted" style={{ marginBottom: '24px' }}>
                {credentialsModal.type === 'reset' 
                  ? 'A new secure PIN has been generated. Please share it with the staff member immediately.'
                  : 'Share these credentials securely. The PIN can be used for quick dashboard login.'}
              </p>
              
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', textAlign: 'left', fontFamily: 'monospace', fontSize: '15px', lineHeight: '2' }}>
                <div><strong>{t('email')}:</strong> {credentialsModal.email}</div>
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '10px', paddingTop: '10px' }}>
                  <strong>{credentialsModal.type === 'reset' ? t('new_pin_label') : t('pin_quick_login_label')}</strong> <span style={{ color: 'var(--orange-500)', fontWeight: 'bold', fontSize: '22px', letterSpacing: '6px' }}>{credentialsModal.pin}</span>
                </div>
              </div>
              
              <button 
                className="btn btn-secondary" 
                onClick={copyToClipboard}
                style={{ width: '100%', justifyContent: 'center', gap: '8px', marginTop: '16px' }}
              >
                {copied ? t('copied_msg') : t('copy_credentials')}
              </button>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => setCredentialsModal(null)}>
                {credentialsModal.type === 'reset' ? t('close_notify_staff') : t('copy_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('edit_staff_member')}</h2>
              <button className="btn btn-ghost" onClick={() => setEditModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={editModal.name} onChange={e => setEditModal({ ...editModal, name: e.target.value })} placeholder={t('full_name_placeholder')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">{t('email')}</label>
                  <input className="form-input" value={editModal.email || ''} onChange={e => setEditModal({ ...editModal, email: e.target.value })} placeholder="email@cleanflow.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('phone')}</label>
                  <input className="form-input" value={editModal.phone || ''} onChange={e => setEditModal({ ...editModal, phone: e.target.value })} placeholder="+91-..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('role')}</label>
                <select className="form-select" value={editModal.role} onChange={e => setEditModal({ ...editModal, role: e.target.value })}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditModal(null)}>{t('cancel')}</button>
              <button className="btn btn-primary" onClick={handleUpdate} disabled={!editModal.name}>{t('save_changes')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
