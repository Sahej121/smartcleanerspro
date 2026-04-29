'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useUser } from '@/lib/UserContext';
import { useNotifications } from '@/lib/NotificationContext';
import Link from 'next/link';
import PWAInstallButton from './common/PWAInstallButton';

export default function Header({ setMobileMenuOpen }) {
  const { t } = useLanguage();
  const { user, role } = useUser();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const router = useRouter();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [bellShake, setBellShake] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/orders?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Trigger bell shake when unread count changes
  useEffect(() => {
    if (unreadCount > 0) {
      setBellShake(true);
      const timer = setTimeout(() => setBellShake(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-3 lg:px-8 h-14 lg:h-16 w-full bg-theme-surface/80 backdrop-blur-xl border-b border-theme-border transition-colors">
      <div className="flex items-center gap-2 lg:gap-4 flex-1">
        <button 
          className="lg:hidden p-2 text-theme-text-muted hover:bg-theme-surface-container rounded-xl transition-colors shrink-0"
          onClick={() => setMobileMenuOpen?.(true)}
        >
          <span className="material-symbols-outlined text-[22px]">menu_open</span>
        </button>
        
        {/* Mobile: icon-only search that expands | Desktop: always visible */}
        {!searchFocused && (
          <button 
            className="lg:hidden p-2 text-theme-text-muted hover:bg-theme-surface-container rounded-xl transition-colors"
            onClick={() => setSearchFocused(true)}
          >
            <span className="material-symbols-outlined text-[22px]">search</span>
          </button>
        )}
        <form onSubmit={handleSearch} className={`relative transition-all duration-500 ${
          searchFocused 
            ? 'fixed inset-x-0 top-0 z-50 px-3 py-2 bg-theme-surface/95 backdrop-blur-xl lg:relative lg:inset-auto lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none'
            : 'hidden lg:block w-full max-w-md'
        } ${searchFocused ? 'max-w-lg' : ''}`}>
          <div className="relative w-full">
            <span className={`material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-sm transition-colors duration-300 ${searchFocused ? 'text-primary' : 'text-theme-text-muted'}`}>search</span>
            <input 
              className={`w-full bg-theme-surface-container border rounded-full py-2.5 lg:py-2.5 pl-10 pr-12 lg:pr-4 text-sm placeholder:text-theme-text-muted/70 outline-none transition-all duration-300 text-theme-text ${
                searchFocused 
                  ? 'border-primary/30 ring-4 ring-primary/10 shadow-lg shadow-primary/5 bg-theme-surface' 
                  : 'border-theme-border focus:ring-2 focus:ring-primary/20'
              }`}
              placeholder={t('search_orders') || "Search orders, customers, or items..."} 
              type="text"
              autoFocus={searchFocused}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => { if (!searchQuery) setSearchFocused(false); }}
            />
            {/* Mobile close button */}
            {searchFocused && (
              <button 
                type="button"
                onClick={() => { setSearchFocused(false); setSearchQuery(''); }}
                className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1 text-theme-text-muted"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button 
            className={`p-2.5 text-theme-text-muted hover:bg-primary/10 hover:text-primary rounded-full transition-all relative ${bellShake ? 'bell-shake' : ''}`}
            onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllAsRead(); }}
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-theme-surface status-dot-pulse"></span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-theme-surface p-5 rounded-2xl shadow-xl z-50 border border-theme-border animate-fade-in-down">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-sm text-theme-text">Notifications</h3>
                <span className="text-[10px] text-theme-text-muted font-bold bg-theme-surface-container px-2 py-0.5 rounded-full">{notifications.length} total</span>
              </div>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="text-center py-6">
                    <span className="material-symbols-outlined text-3xl text-theme-text-muted/50 mb-2 block">notifications_off</span>
                    <p className="text-xs text-theme-text-muted font-medium">No new alerts</p>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div key={n.id} className={`p-3 bg-theme-surface-container rounded-xl border border-theme-border hover:bg-theme-surface hover:shadow-sm transition-all cursor-pointer animate-fade-in-up stagger-${i + 1}`}>
                      <p className="text-xs font-bold text-theme-text">{n.title}</p>
                      <p className="text-[10px] text-theme-text-muted mb-1 leading-relaxed">{n.message}</p>
                      <p className="text-[9px] text-theme-text-muted/70 font-medium">{new Date(n.time).toLocaleTimeString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* PWA Install */}
        <div className="hidden md:block">
          <PWAInstallButton />
        </div>

        {/* Help */}
        <Link href="/support" className="p-2.5 text-theme-text-muted hover:bg-primary/10 hover:text-primary rounded-full transition-all">
          <span className="material-symbols-outlined">help</span>
        </Link>

        <div className="h-8 w-[1px] bg-theme-border mx-1"></div>

        {/* User Profile */}
        <div className="relative">
          <div 
            className="flex items-center gap-3 pl-2 group cursor-pointer hover:bg-theme-surface-container rounded-2xl px-3 py-1.5 transition-all"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="text-right hidden lg:block">
              <p className="text-xs font-bold text-theme-text leading-none">{user?.name || 'Guest'}</p>
              <p className="text-[10px] text-primary font-semibold capitalize mt-1 flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                {t(role) || role || 'User'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-primary/20 p-0.5 group-hover:border-primary/40 transition-colors">
              <div className="w-full h-full rounded-full premium-gradient flex items-center justify-center text-white font-bold text-sm shadow-inner">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
              <div className="absolute top-full right-0 mt-2 w-56 bg-theme-surface rounded-2xl shadow-xl z-50 border border-theme-border py-2 animate-fade-in-down overflow-hidden">
                <div className="px-4 py-3 border-b border-theme-border mb-1">
                  <p className="text-xs font-black text-theme-text truncate">{user?.name || 'User Account'}</p>
                  <p className="text-[10px] text-theme-text-muted truncate font-medium">{user?.email || 'sahej@smartcleaners.pro'}</p>
                </div>
                
                <Link 
                  href="/profile" 
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-theme-text hover:bg-theme-surface-container transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <span className="material-symbols-outlined text-lg text-primary">person</span>
                  My Account
                </Link>
                
                {(role === 'owner' || role === 'superadmin') && (
                  <Link 
                    href="/admin/settings" 
                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-theme-text hover:bg-theme-surface-container transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <span className="material-symbols-outlined text-lg text-primary">storefront</span>
                    POS Settings
                  </Link>
                )}

                <div className="border-t border-theme-border mt-1 pt-1">
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-error hover:bg-error/10 transition-colors"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
