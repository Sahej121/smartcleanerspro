'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@/lib/UserContext';
import { normalizeTier } from '@/lib/tier-config';

const BrandingContext = createContext();

export function BrandingProvider({ children }) {
  const { user } = useUser();
  const [systemName, setSystemName] = useState("Dry Cleaner's flow");
  const [systemLogo, setSystemLogo] = useState('🍃');
  const [primaryColor, setPrimaryColor] = useState('#10b981');
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
            setSystemName(data.user.branding.name || "Dry Cleaner's flow");
            setSystemLogo(data.user.branding.logo || '🍃');
            setPrimaryColor(data.user.branding.primaryColor || '#10b981');
            setLoading(false);
            setMounted(true);
            return;
          }
        }
      } catch (e) { console.error('Failed to fetch branding from session', e); }

      // 2. Fallback to localStorage
      const savedName = localStorage.getItem('cleanflow_system_name');
      const savedLogo = localStorage.getItem('cleanflow_system_logo');
      const savedColor = localStorage.getItem('cleanflow_primary_color');

      if (savedName) setSystemName(savedName);
      if (savedLogo) setSystemLogo(savedLogo);
      if (savedColor) setPrimaryColor(savedColor);

      setLoading(false);
      setMounted(true);
    };

    init();
  }, [user]);

  // Inject primary color into CSS variables
  useEffect(() => {
    if (mounted) {
      document.documentElement.style.setProperty('--primary', primaryColor);
      document.documentElement.style.setProperty('--primary-rgb', hexToRgb(primaryColor));
    }
  }, [primaryColor, mounted]);

  const updateBranding = async (name, logo, color) => {
    const finalName = name || systemName;
    const finalLogo = logo || systemLogo;
    const finalColor = color || primaryColor;

    setSystemName(finalName);
    setSystemLogo(finalLogo);
    setPrimaryColor(finalColor);
    
    localStorage.setItem('cleanflow_system_name', finalName);
    localStorage.setItem('cleanflow_system_logo', finalLogo);
    localStorage.setItem('cleanflow_primary_color', finalColor);
    
    // Sync to DB (for primary store)
    if (user?.store_id) {
      try {
        await fetch(`/api/stores/${user.store_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            store_name: finalName,
            branding: {
              name: finalName,
              logo: finalLogo,
              primaryColor: finalColor
            }
          })
        });
      } catch (e) { console.error('Failed to sync branding to DB', e); }
    }
  };

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }

  return (
    <BrandingContext.Provider value={{ systemName, systemLogo, primaryColor, updateBranding, loading, mounted }}>
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
