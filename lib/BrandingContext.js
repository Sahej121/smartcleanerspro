'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@/lib/UserContext';
import { normalizeTier } from '@/lib/tier-config';

const BrandingContext = createContext();

export function BrandingProvider({ children }) {
  const { user } = useUser();
  const [systemName, setSystemName] = useState("Dry Cleaner's flow");
  const [systemLogo, setSystemLogo] = useState('C');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const init = async () => {
      // 1. Try to get from session (DB Source of Truth)
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.branding) {
            setSystemName(data.user.branding.name);
            setSystemLogo(data.user.branding.logo);
            setLoading(false);
            setMounted(true);
            return;
          }
        }
      } catch (e) { console.error('Failed to fetch branding from session', e); }

      // 2. Fallback to localStorage
      const savedName = localStorage.getItem('cleanflow_system_name');
      const savedLogo = localStorage.getItem('cleanflow_system_logo');

      if (savedName) setSystemName(savedName);
      if (savedLogo) setSystemLogo(savedLogo);

      setLoading(false);
      setMounted(true);
    };

    init();
  }, [user]);

  const updateBranding = async (name, logo) => {
    setSystemName(name);
    setSystemLogo(logo);
    localStorage.setItem('cleanflow_system_name', name);
    localStorage.setItem('cleanflow_system_logo', logo);
    
    // Sync to DB (for primary store)
    if (user?.store_id) {
      try {
        await fetch(`/api/stores/${user.store_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ store_name: name })
        });
      } catch (e) { console.error('Failed to sync branding to DB', e); }
    }
  };

  return (
    <BrandingContext.Provider value={{ systemName, systemLogo, updateBranding, loading, mounted }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}
