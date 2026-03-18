'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useUser, ROLES } from '@/lib/UserContext';
import { useBranding } from '@/lib/BrandingContext';

const navSections = [
  {
    titleKey: 'nav_foh',
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN, ROLES.WORKER],
    links: [
      { href: '/', labelKey: 'nav_dashboard', icon: '', allowedRoles: [ROLES.OWNER, ROLES.ADMIN, ROLES.WORKER] },
      { href: '/orders/new', labelKey: 'nav_new_order', icon: '', allowedRoles: [ROLES.OWNER, ROLES.ADMIN, ROLES.WORKER] },
      { href: '/orders', labelKey: 'nav_orders', icon: '', allowedRoles: [ROLES.OWNER, ROLES.ADMIN, ROLES.WORKER] },
      { href: '/customers', labelKey: 'nav_customers', icon: '', allowedRoles: [ROLES.OWNER, ROLES.ADMIN, ROLES.WORKER] },
    ],
  },
  {
    titleKey: 'nav_boh',
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN, ROLES.WORKER],
    links: [
      { href: '/operations', labelKey: 'nav_operations', icon: '', allowedRoles: [ROLES.OWNER, ROLES.ADMIN, ROLES.WORKER] },
      { href: '/operations/scanner', labelKey: 'nav_scanner', icon: '', allowedRoles: [ROLES.OWNER, ROLES.ADMIN, ROLES.WORKER] },
      { href: '/operations/quality', labelKey: 'nav_quality', icon: '', allowedRoles: [ROLES.OWNER, ROLES.ADMIN, ROLES.WORKER] },
    ],
  },
  {
    titleKey: 'nav_admin',
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN],
    links: [
      { href: '/admin', labelKey: 'nav_analytics', icon: '', allowedRoles: [ROLES.OWNER, ROLES.ADMIN] },
      { href: '/admin/staff', labelKey: 'nav_staff', icon: '', allowedRoles: [ROLES.OWNER, ROLES.ADMIN] },
      { href: '/admin/pricing', labelKey: 'nav_pricing', icon: '', allowedRoles: [ROLES.OWNER, ROLES.ADMIN] },
    ],
  },
  {
    titleKey: 'Preferences',
    allowedRoles: [ROLES.OWNER, ROLES.ADMIN, ROLES.WORKER],
    links: [
      { href: '/admin/settings', labelKey: 'nav_settings', icon: '', allowedRoles: [ROLES.OWNER, ROLES.ADMIN, ROLES.WORKER] },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { role, user } = useUser();
  const { systemName, systemLogo } = useBranding();

  function isActive(href) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  // Filter sections and links based on the current user's role
  const filteredSections = navSections
    .filter(section => section.allowedRoles.includes(role))
    .map(section => ({
      ...section,
      links: section.links.filter(link => link.allowedRoles.includes(role))
    }))
    .filter(section => section.links.length > 0);

  return (
    <nav className="sidebar" id="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)' }}>
          {systemLogo || 'C'}
        </div>
        <div className="sidebar-logo-text">
          <h1 style={{ letterSpacing: '-0.02em' }}>{systemName || 'CleanFlow'}</h1>
          <p style={{ fontWeight: 600, color: 'var(--primary-600)' }}>Smart Solutions</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredSections.map((section) => (
          <div key={section.titleKey} className="sidebar-section">
            <div className="sidebar-section-title">{t(section.titleKey)}</div>
            {section.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`sidebar-link ${isActive(link.href) ? 'active' : ''}`}
                style={{ paddingLeft: '16px' }}
              >
                <span>{t(link.labelKey)}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid var(--border-light)' }}>
        {user?.impersonatedBy && (
          <div style={{ marginBottom: '12px', padding: '10px', background: 'var(--amber-50)', border: '1px solid var(--amber-200)', borderRadius: '10px', fontSize: '12px' }}>
            <div style={{ fontWeight: 600, color: 'var(--amber-700)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>⚠️</span> Impersonating Store Admin
            </div>
            <div style={{ fontSize: '10px', color: 'var(--amber-600)', marginBottom: '8px' }}>
              Logged in as {user.name}
            </div>
            <button 
              className="btn btn-primary btn-sm" 
              style={{ width: '100%', fontSize: '11px', padding: '6px' }}
              onClick={async () => {
                document.cookie = 'cleanflow_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                window.location.href = '/login';
              }}
            >
              End Session
            </button>
          </div>
        )}
        <div className="sidebar-footer-brand">
          powered by <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>smartcleanerspro</span>
        </div>
      </div>
    </nav>
  );
}
