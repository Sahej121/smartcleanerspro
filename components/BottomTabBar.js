'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useUser, ROLES } from '@/lib/UserContext';

const TAB_ITEMS = [
  { href: '/', labelKey: 'nav_dashboard', icon: 'dashboard', activeIcon: 'dashboard' },
  { href: '/orders/new', labelKey: 'nav_new_order', icon: 'add_circle', activeIcon: 'add_circle', isPrimary: true },
  { href: '/orders', labelKey: 'nav_orders', icon: 'receipt_long', activeIcon: 'receipt_long' },
  { href: '/customers', labelKey: 'nav_customers', icon: 'group', activeIcon: 'group' },
];

export default function BottomTabBar({ onMoreTap }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user } = useUser();

  // Don't show if not logged in
  if (!user) return null;

  function isActive(href) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[55] lg:hidden">
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-theme-surface/85 backdrop-blur-2xl border-t border-theme-border/60" />
      
      <div className="relative flex items-end justify-around px-2 pt-1.5 safe-area-bottom">
        {TAB_ITEMS.map((tab) => {
          const active = isActive(tab.href);
          
          if (tab.isPrimary) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center -mt-4 relative"
              >
                <div className="w-14 h-14 rounded-2xl primary-gradient flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 active:scale-90 transition-transform">
                  <span 
                    className="material-symbols-outlined text-[26px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {tab.icon}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.08em] text-emerald-600 mt-1.5 mb-1">
                  {t(tab.labelKey)}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-2 px-3 min-w-[64px] rounded-xl transition-all active:scale-90 ${
                active
                  ? 'text-emerald-600'
                  : 'text-theme-text-muted/50'
              }`}
            >
              <div className="relative">
                <span 
                  className={`material-symbols-outlined text-[24px] transition-all ${active ? 'text-emerald-600' : ''}`}
                  style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {active ? tab.activeIcon : tab.icon}
                </span>
                {active && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                )}
              </div>
              <span className={`text-[9px] font-bold mt-1 uppercase tracking-[0.06em] transition-colors ${
                active ? 'font-black text-emerald-600' : ''
              }`}>
                {t(tab.labelKey)}
              </span>
            </Link>
          );
        })}
        
        {/* More tab */}
        <button
          onClick={onMoreTap}
          className="flex flex-col items-center justify-center py-2 px-3 min-w-[64px] rounded-xl text-theme-text-muted/50 active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
          <span className="text-[9px] font-bold mt-1 uppercase tracking-[0.06em]">More</span>
        </button>
      </div>
    </nav>
  );
}
