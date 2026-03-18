import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useUser, ROLES } from '@/lib/UserContext';
import { useNotifications } from '@/lib/NotificationContext';
import Link from 'next/link';

export default function Header() {
  const { t } = useLanguage();
  const { user, role, logout } = useUser();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header className="header" id="app-header">
      <div className="header-left">
        <div className="header-search">
          <span className="header-search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input type="text" placeholder={t('search_orders') || 'Search everything...'} style={{ background: 'var(--slate-100)', border: '1px solid transparent' }} />
        </div>
      </div>

      <div className="header-right">
        {user && (
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={logout}
            style={{ marginRight: '8px', color: 'var(--text-secondary)' }}
          >
            Logout
          </button>
        )}

        <div style={{ position: 'relative' }}>
          <button 
            className="header-icon-btn" 
            title="Notifications" 
            id="notifications-btn"
            onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllAsRead(); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            {unreadCount > 0 && <span className="notification-dot"></span>}
          </button>

          {showNotifs && (
            <div className="card" style={{ 
              position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '320px', 
              zIndex: 1000, padding: '12px', maxHeight: '400px', overflowY: 'auto' 
            }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                Notifications
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 400 }}>{notifications.length} total</span>
              </div>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)', fontSize: '13px' }}>No new alerts</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{ padding: '8px', borderRadius: '8px', background: n.read ? 'transparent' : 'var(--primary-50)', border: '1px solid rgba(0,0,0,0.03)' }}>
                      <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>{n.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{n.message}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>{new Date(n.time).toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <Link href="/admin/settings" className="header-icon-btn" title={t('settings') || "Settings"} id="settings-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </Link>
        <button className="header-user" id="user-menu-btn">
          <div className="header-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
          <div className="header-user-info">
            <div className="header-user-name">{user?.name || 'User'}</div>
            <div className="header-user-role" style={{ textTransform: 'capitalize' }}>
              {t(role) || role || 'Worker'}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
}
