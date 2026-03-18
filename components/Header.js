import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useUser, ROLES } from '@/lib/UserContext';
import Link from 'next/link';

export default function Header() {
  const { t } = useLanguage();
  const { user, role, logout } = useUser();

  return (
    <header className="header" id="app-header">
      <div className="header-left">
        <div className="header-search">
          <span className="header-search-icon"></span>
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

        <button className="header-icon-btn" title="Notifications" id="notifications-btn">
          <span className="notification-dot"></span>
        </button>
        <Link href="/admin/settings" className="header-icon-btn" title={t('settings') || "Settings"} id="settings-btn">
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
