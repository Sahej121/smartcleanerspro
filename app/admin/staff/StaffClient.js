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
    <div id="staff-page" className="p-4 lg:p-10 max-w-[1600px] mx-auto min-h-screen animate-page-fade-in space-y-10">
      {/* ═══════════════════════════════════════════════
          HEADER SECTION
          ═══════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 reveal reveal-up active">
        <div className="space-y-1">
          <h1 className="text-5xl font-black text-theme-text tracking-tighter font-outfit italic">
            {t('staff_management')}
          </h1>
          <p className="text-theme-text-muted font-bold tracking-tight text-lg opacity-80 max-w-xl leading-snug">
            {t('staff_management_desc')}
          </p>
        </div>
        
        {[USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN].includes(userRole?.toLowerCase()) && (
          <button 
            className="premium-gradient text-white px-12 py-5 rounded-[2rem] text-sm font-black shadow-2xl shadow-emerald-600/30 hover:scale-[1.03] active:scale-95 transition-all duration-300 flex items-center gap-3 shrink-0"
            onClick={() => setShowModal(true)}
          >
            <span className="material-symbols-outlined font-black">person_add</span>
            {t('add_staff')}
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          STATISTICS GRID
          ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {ROLES.map((role, i) => {
          const count = staff.filter(s => s.role?.toLowerCase() === role).length;
          const icons = { owner: 'crown', manager: 'admin_panel_settings', frontdesk: 'desk', staff: 'engineering', driver: 'local_shipping' };
          
          return (
            <div 
              key={role} 
              className={`glass-card-premium p-8 items-center text-center group reveal reveal-up delay-${(i + 1) * 100} active`}
            >
              <div className="w-14 h-14 rounded-3xl mb-4 flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg"
                   style={{ background: `${ROLE_COLORS[role]}15`, color: ROLE_COLORS[role] }}>
                <span className="material-symbols-outlined text-3xl font-black">{icons[role] || 'person'}</span>
              </div>
              <div className="text-4xl font-black tracking-tighter text-theme-text mb-1">{count}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60" style={{ color: ROLE_COLORS[role] }}>
                {role}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════
          STAFF DATA TABLE
          ═══════════════════════════════════════════════ */}
      <div className="glass-panel rounded-[3rem] overflow-hidden border border-theme-border shadow-2xl shadow-black/5 reveal reveal-up delay-200 active">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-theme-surface-container/50 border-b border-theme-border">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted">{t('name')}</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted">{t('email')}</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted">{t('phone')}</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted">{t('role')}</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted">{t('store')}</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-theme-text-muted text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/50">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                       <span className="material-symbols-outlined text-6xl">group_off</span>
                       <p className="text-sm font-black uppercase tracking-widest">{t('no_staff_found')}</p>
                    </div>
                  </td>
                </tr>
              ) : staff.map((s, i) => (
                <tr key={s.id} className="hover:bg-theme-surface-container/30 transition-colors group animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg group-hover:scale-110 transition-transform duration-300"
                           style={{ background: ROLE_COLORS[s.role?.toLowerCase()] || 'var(--primary-600)' }}>
                        {s.name.charAt(0)}
                      </div>
                      <span className="font-black tracking-tight text-theme-text text-lg">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-bold text-theme-text-muted text-sm">{s.email || '—'}</td>
                  <td className="px-8 py-6 font-bold text-theme-text-muted text-sm">{s.phone || '—'}</td>
                  <td className="px-8 py-6">
                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border"
                          style={{ background: `${ROLE_COLORS[s.role?.toLowerCase()]}10`, color: ROLE_COLORS[s.role?.toLowerCase()], borderColor: `${ROLE_COLORS[s.role?.toLowerCase()]}20` }}>
                      {s.role}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-bold text-theme-text-muted text-sm italic">{s.store_name || '—'}</td>
                  <td className="px-8 py-6">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                      <button 
                        onClick={() => handleResetPin(s)}
                        className="w-10 h-10 rounded-xl bg-theme-surface border border-theme-border flex items-center justify-center hover:border-blue-500 hover:text-blue-500 transition-all shadow-sm active:scale-90"
                        title="Reset PIN"
                      >
                        <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                      </button>
                      <button 
                        onClick={() => setEditModal(s)}
                        className="w-10 h-10 rounded-xl bg-theme-surface border border-theme-border flex items-center justify-center hover:border-emerald-500 hover:text-emerald-500 transition-all shadow-sm active:scale-90"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id)}
                        className="w-10 h-10 rounded-xl bg-theme-surface border border-theme-border flex items-center justify-center hover:border-red-500 hover:text-red-500 transition-all shadow-sm active:scale-90"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          MODALS
          ═══════════════════════════════════════════════ */}
      {(showModal || editModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-theme-text/40 backdrop-blur-md" onClick={() => { setShowModal(false); setEditModal(null); }}></div>
          <div className="bg-theme-surface w-full max-w-xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-white/20 animate-scale-in">
            <div className="px-10 py-8 border-b border-theme-border flex justify-between items-center">
              <h2 className="text-2xl font-black tracking-tighter italic">{editModal ? t('edit_staff_member') : t('add_staff_member')}</h2>
              <button onClick={() => { setShowModal(false); setEditModal(null); }} className="w-10 h-10 rounded-full hover:bg-theme-surface-container flex items-center justify-center transition-colors">
                 <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted ml-1">{t('full_name')}</label>
                <input 
                  className="w-full bg-theme-surface-container border-2 border-transparent focus:border-theme-accent focus:bg-theme-surface rounded-2xl px-6 py-4 font-bold outline-none transition-all placeholder:opacity-30"
                  value={editModal ? editModal.name : newStaff.name} 
                  onChange={e => editModal ? setEditModal({...editModal, name: e.target.value}) : setNewStaff({ ...newStaff, name: e.target.value })} 
                  placeholder={t('full_name_placeholder')} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted ml-1">{t('email')}</label>
                  <input 
                    className="w-full bg-theme-surface-container border-2 border-transparent focus:border-theme-accent focus:bg-theme-surface rounded-2xl px-6 py-4 font-bold outline-none transition-all placeholder:opacity-30"
                    value={editModal ? editModal.email || '' : newStaff.email} 
                    onChange={e => editModal ? setEditModal({...editModal, email: e.target.value}) : setNewStaff({ ...newStaff, email: e.target.value })} 
                    placeholder="email@cleanflow.com" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted ml-1">{t('phone')}</label>
                  <input 
                    className="w-full bg-theme-surface-container border-2 border-transparent focus:border-theme-accent focus:bg-theme-surface rounded-2xl px-6 py-4 font-bold outline-none transition-all placeholder:opacity-30"
                    value={editModal ? editModal.phone || '' : newStaff.phone} 
                    onChange={e => editModal ? setEditModal({...editModal, phone: e.target.value}) : setNewStaff({ ...newStaff, phone: e.target.value })} 
                    placeholder="+91-..." 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted ml-1">{t('role')}</label>
                <select 
                  className="w-full bg-theme-surface-container border-2 border-transparent focus:border-theme-accent focus:bg-theme-surface rounded-2xl px-6 py-4 font-bold outline-none transition-all appearance-none cursor-pointer"
                  value={editModal ? editModal.role : newStaff.role} 
                  onChange={e => editModal ? setEditModal({...editModal, role: e.target.value}) : setNewStaff({ ...newStaff, role: e.target.value })}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className="px-10 py-8 bg-theme-surface-container/50 border-t border-theme-border flex justify-end gap-4">
              <button 
                className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-theme-text-muted hover:bg-theme-surface-container transition-colors"
                onClick={() => { setShowModal(false); setEditModal(null); }}
              >
                {t('cancel')}
              </button>
              <button 
                className="premium-gradient text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
                onClick={editModal ? handleUpdate : handleCreate}
                disabled={editModal ? !editModal.name : !newStaff.name}
              >
                {editModal ? t('save_changes') : t('add_member')}
              </button>
            </div>
          </div>
        </div>
      )}

      {credentialsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-theme-text/60 backdrop-blur-xl" onClick={() => setCredentialsModal(null)}></div>
          <div className="bg-theme-surface w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 overflow-hidden border border-white/20 animate-scale-in p-12 text-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-200">
               <span className="material-symbols-outlined text-4xl font-black">{credentialsModal.type === 'reset' ? 'lock_reset' : 'verified_user'}</span>
            </div>
            
            <h2 className="text-3xl font-black tracking-tighter italic mb-3">
               {credentialsModal.type === 'reset' ? t('pin_regenerated') : t('staff_member_added')}
            </h2>
            
            <p className="text-theme-text-muted font-bold tracking-tight mb-10 leading-relaxed">
              {credentialsModal.type === 'reset' 
                ? 'A new secure PIN has been generated. Please share it with the staff member immediately.'
                : 'Share these credentials securely. The PIN can be used for quick dashboard login.'}
            </p>
            
            <div className="bg-theme-surface-container rounded-[2rem] p-8 space-y-4 border border-theme-border text-left relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                 <span className="material-symbols-outlined text-8xl">fingerprint</span>
              </div>
              <div className="relative z-10">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted mb-1">{t('email')}</div>
                <div className="text-lg font-black text-theme-text tracking-tight truncate">{credentialsModal.email}</div>
              </div>
              <div className="relative z-10 pt-4 border-t border-theme-border/50">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text-muted mb-2">
                  {credentialsModal.type === 'reset' ? t('new_pin_label') : t('pin_quick_login_label')}
                </div>
                <div className="text-5xl font-black text-emerald-600 tracking-[0.5em] italic">{credentialsModal.pin}</div>
              </div>
            </div>
            
            <div className="mt-10 flex flex-col gap-4">
              <button 
                onClick={copyToClipboard}
                className="w-full py-5 rounded-2xl bg-theme-surface border-2 border-theme-border font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:border-emerald-500 hover:text-emerald-600 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">{copied ? 'check' : 'content_copy'}</span>
                {copied ? t('copied_msg') : t('copy_credentials')}
              </button>
              <button 
                onClick={() => setCredentialsModal(null)}
                className="w-full py-5 rounded-2xl bg-theme-text text-theme-surface font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-black/20"
              >
                {credentialsModal.type === 'reset' ? t('close_notify_staff') : t('copy_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
