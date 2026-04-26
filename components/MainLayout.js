'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ScrollObserver from '@/components/ScrollObserver';
import { normalizeTier } from '@/lib/tier-config';

export default function MainLayout({ children }) {
  const pathname = usePathname();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isPublicPage = ['/', '/features', '/how-it-works', '/pricing', '/contact', '/policy', '/checkout', '/register', '/waiting', '/enterprise-upgrade'].includes(pathname) || pathname.startsWith('/checkout/');
  const userTier = normalizeTier(user?.tier);
  const isSuperAdmin = (user?.role === 'owner' || user?.role === 'superadmin') && (user?.id == 1);
  const themeClass = (userTier === 'enterprise' && !isSuperAdmin) ? 'theme-enterprise' : 'theme-standard';
  const isMarketingPage = isPublicPage && pathname !== '/';

  if (isAuthPage || isMarketingPage || (!user && isPublicPage)) {
    return (
      <ScrollObserver>
        <main className={`min-h-screen bg-background text-theme-text ${themeClass}`}>{children}</main>
      </ScrollObserver>
    );
  }

  return (
    <ScrollObserver>
      <div className={`flex min-h-screen bg-background text-theme-text overflow-hidden ${themeClass}`}>
        <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <div className="flex-1 lg:ml-64 w-full flex flex-col h-[100dvh] overflow-y-auto relative">
          <Header setMobileMenuOpen={setMobileMenuOpen} />
          <main className="flex-1 p-4 lg:p-8 w-full max-w-full overflow-x-hidden animate-page-fade-in" key={pathname}>
            {children}
          </main>
        </div>
      </div>
    </ScrollObserver>
  );
}
