'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { normalizeTier } from '@/lib/tier-config';

const UserContext = createContext();

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'manager',
  STAFF: 'staff',
  FRONTDESK: 'frontdesk',
  DRIVER: 'driver',
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    setLoading(true);
    console.log('[UserContext] Fetching user...');
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        console.log('[UserContext] User found:', data.user?.id, 'Role:', data.user?.role);
        setUser(data.user);
        // Map backend worker to frontend staff
        setRole(data.user.role);
      } else {
        console.log('[UserContext] No active session (OK)');
        setUser(null);
        setRole(null);
      }
    } catch (err) {
      console.error('[UserContext] Fetch error:', err);
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
      console.log('[UserContext] Loading finished');
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Handle suspension and auth redirection
  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup';
    const isPublicPage = ['/', '/features', '/how-it-works', '/pricing', '/contact', '/policy'].includes(pathname);
    const isSuspendedPage = pathname === '/suspended';

    if (!user && !isAuthPage && !isPublicPage) {
      router.push('/login');
    } else if (user?.suspended && !isSuspendedPage && !isAuthPage && role !== 'owner') {
      router.push('/suspended');
    } else if (user && isAuthPage) {
      router.push('/');
    } else if (!user?.suspended && isSuspendedPage) {
      router.push('/');
    }
  }, [user, loading, pathname, router, role]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setRole(null);
    router.push('/login');
  };

  // Skip rendering the app shell if we're still checking auth
  // But allow rendering auth pages immediately
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  
  if (loading && !isAuthPage) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, role, loading, fetchUser, logout, ROLES }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) return { user: null, role: null, loading: true, fetchUser: async()=>{}, logout: async()=>{}, ROLES };
  return ctx;
}
