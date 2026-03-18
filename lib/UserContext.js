'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const UserContext = createContext();

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  WORKER: 'worker'
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setRole(data.user.role);
      } else {
        setUser(null);
        setRole(null);
      }
    } catch (err) {
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

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
