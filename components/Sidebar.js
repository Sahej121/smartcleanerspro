'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useUser, ROLES } from '@/lib/UserContext';
import { useBranding } from '@/lib/BrandingContext';
import { canAccessRoute, normalizeTier } from '@/lib/tier-config';

const getNavLinks = (role, userTier, isSaasOwner) => {
  if ((role === ROLES.OWNER || role === ROLES.SUPERADMIN) && isSaasOwner) {
    return [
      { href: '/', labelKey: 'nav_dashboard', icon: 'grid_view' },
      { href: '/master/nodes', labelKey: 'nav_manage_nodes', icon: 'dns' },
      { href: '/master/insights', labelKey: 'nav_system_insights', icon: 'query_stats' },
      { href: '/master/logs', labelKey: 'nav_global_logs', icon: 'terminal' },
      { href: '/master/security', labelKey: 'nav_security', icon: 'health_and_safety' },
      { href: '/admin/settings', labelKey: 'nav_settings', icon: 'settings' },
      { href: '/admin/pricing', labelKey: 'Garment Prices', icon: 'currency_rupee' },
    ];
  }

  // Business owner should see the same nav as store admins (plus settings),
  // not the SaaS master-control navigation.
  if (role === ROLES.OWNER && !isSaasOwner) {
    return [
      { href: '/', labelKey: 'nav_dashboard', icon: 'dashboard' },
      { href: '/orders/new', labelKey: 'nav_new_order', icon: 'add_circle' },
      { href: '/orders', labelKey: 'nav_orders', icon: 'receipt_long' },
      { href: '/customers', labelKey: 'nav_customers', icon: 'group' },
      { href: '/admin/pricing', labelKey: 'Garment Prices', icon: 'currency_rupee' },
      { href: '/admin/analytics/staff', labelKey: 'nav_staff_analytics', icon: 'analytics' },
      { href: '/inventory', labelKey: 'nav_inventory', icon: 'inventory_2' },
      { href: '/operations/assembly', labelKey: 'nav_assembly', icon: 'route' },
      { href: '/operations/machines', labelKey: 'Machine Ops', icon: 'precision_manufacturing' },
      { href: '/logistics', labelKey: 'Logistics Driver', icon: 'local_shipping' },
      { href: '/agent/pickup', labelKey: 'Agent Pickup', icon: 'delivery_dining' },
      { href: '/admin/settings', labelKey: 'nav_settings', icon: 'settings' },
    ].filter(link => canAccessRoute(userTier, link.href));
  }

  // Standard Store Admin / Staff Nav
  return [
    { href: '/', labelKey: 'nav_dashboard', icon: 'dashboard', allowedRoles: [ROLES.ADMIN, ROLES.STAFF, ROLES.FRONTDESK, ROLES.DRIVER] },
    { href: '/orders/new', labelKey: 'nav_new_order', icon: 'add_circle', allowedRoles: [ROLES.ADMIN] },
    { href: '/orders', labelKey: 'nav_orders', icon: 'receipt_long', allowedRoles: [ROLES.ADMIN] },
    { href: '/customers', labelKey: 'nav_customers', icon: 'group', allowedRoles: [ROLES.ADMIN] },
    { href: '/admin/pricing', labelKey: 'Garment Prices', icon: 'currency_rupee', allowedRoles: [ROLES.ADMIN] },
    { href: '/admin/analytics/staff', labelKey: 'nav_staff_analytics', icon: 'analytics', allowedRoles: [ROLES.ADMIN] },
    { href: '/inventory', labelKey: 'nav_inventory', icon: 'inventory_2', allowedRoles: [ROLES.ADMIN] },
    { href: '/operations/assembly', labelKey: 'nav_assembly', icon: 'route', allowedRoles: [ROLES.ADMIN, ROLES.STAFF, ROLES.FRONTDESK] },
    { href: '/operations/machines', labelKey: 'Machine Ops', icon: 'precision_manufacturing', allowedRoles: [ROLES.ADMIN, ROLES.STAFF] },
    { href: '/agent/pickup', labelKey: 'Agent Pickup', icon: 'delivery_dining', allowedRoles: [ROLES.ADMIN, ROLES.STAFF, ROLES.FRONTDESK, ROLES.DRIVER] },
    { href: '/logistics', labelKey: 'Logistics Driver', icon: 'local_shipping', allowedRoles: [ROLES.ADMIN, ROLES.DRIVER] },
    { href: '/admin/settings', labelKey: 'nav_settings', icon: 'settings', allowedRoles: [ROLES.ADMIN] },
  ].filter(link => {
    // Both 'admin' and 'manager' are treated as store managers
    const effectiveRole = role === 'admin' ? ROLES.ADMIN : role;
    if (link.allowedRoles && !link.allowedRoles.includes(effectiveRole)) return false;
    // Apply tier-based feature gating
    if (!canAccessRoute(userTier, link.href)) return false;
    return true;
  });
};

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { role: roleFromContext, user, logout } = useUser();
  const { systemName } = useBranding();

  const isSaasOwner = user?.role === 'superadmin' || user?.email === 'sehajbudhiraja2000@gmail.com';
  const userTier = normalizeTier(user?.tier);
  const role = roleFromContext || (isSaasOwner ? ROLES.OWNER : 'guest');
  const filteredLinks = getNavLinks(role, userTier, isSaasOwner) || [];

  function isActive(href) {
    if (href === '/') return pathname === '/';
    if (pathname === href) return true;
    
    // Find all links that match the current pathname
    const matches = filteredLinks.filter(l => pathname.startsWith(l.href));
    if (matches.length === 0) return false;
    
    // The "active" one is the one with the longest href (most specific path)
    const bestMatch = matches.sort((a, b) => b.href.length - a.href.length)[0];
    return bestMatch.href === href;
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[50] lg:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <aside className={`fixed left-0 top-0 h-[100dvh] w-64 bg-theme-surface glass-sidebar flex flex-col p-4 gap-y-2 z-[60] transition-transform duration-300 ease-in-out border-r border-theme-border ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-3 py-6 mb-4 group">
        <div className="relative">
          <div className="w-11 h-11 rounded-xl premium-gradient flex items-center justify-center text-white shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-105">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          </div>
          {/* System online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-surface"></div>
        </div>
        <div>
          <h1 className="text-lg font-black text-theme-text font-black tracking-tighter font-headline">
            {systemName || 'DrycleanersFlow'}
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-theme-text-muted font-bold">
            Pristine Atelier POS
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-y-1">
        {filteredLinks.map((link, index) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobileMenuOpen?.(false)}
            className={`${isActive(link.href) ? 'sidebar-link-active' : 'sidebar-link'} animate-fade-in-up stagger-${index + 1}`}
          >
            <span className="material-symbols-outlined text-[22px]">{link.icon}</span>
            <span className="font-semibold text-sm">{t(link.labelKey)}</span>
            {isActive(link.href) && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60"></span>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer Area */}
      <div className="mt-auto pt-6 border-t border-outline-variant/10 flex flex-col gap-y-1">
        {user?.impersonatedBy && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] animate-fade-in-up">
            <div className="font-bold text-amber-700 mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">warning</span>
              Impersonation Active
            </div>
            <p className="text-amber-600 mb-2">Acting as {user.name}</p>
            <button 
              onClick={() => {
                document.cookie = 'cleanflow_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                window.location.href = '/login';
              }}
              className="w-full py-1.5 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-colors"
            >
              End Session
            </button>
          </div>
        )}


        <Link href="/support" className="flex items-center gap-3 px-4 py-2 text-theme-text-muted hover:text-theme-text hover:bg-theme-bg/50 transition-all rounded-xl">
          <span className="material-symbols-outlined text-xl">contact_support</span>
          <span className="text-sm font-medium">Support</span>
        </Link>
        
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2 text-theme-text-muted hover:text-error hover:bg-red-50/50 transition-all rounded-xl w-full text-left"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
