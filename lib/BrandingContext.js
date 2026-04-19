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

  useEffect(() => {
    const savedName = localStorage.getItem('cleanflow_system_name');
    const savedLogo = localStorage.getItem('cleanflow_system_logo');

    // Branding Migration: Reset "nzdc" or default "DrycleanersFlow" to new branding
    const lowerName = savedName?.toLowerCase();
    if (lowerName === 'nzdc' || lowerName === 'drycleanersflow') {
      localStorage.setItem('cleanflow_system_name', "Dry Cleaner's flow");
      setSystemName("Dry Cleaner's flow");
    } else if (user && normalizeTier(user.tier) === 'software_only') {
      setSystemName("Dry Cleaner's flow");
      localStorage.setItem('cleanflow_system_name', "Dry Cleaner's flow");
    } else {
      if (savedName) setSystemName(savedName);
      else {
        setSystemName("Dry Cleaner's flow");
        localStorage.setItem('cleanflow_system_name', "Dry Cleaner's flow");
      }
    }

    if (savedLogo) setSystemLogo(savedLogo);

    setLoading(false);
  }, [user]);

  const updateBranding = (name, logo) => {
    setSystemName(name);
    setSystemLogo(logo);
    localStorage.setItem('cleanflow_system_name', name);
    localStorage.setItem('cleanflow_system_logo', logo);
  };

  return (
    <BrandingContext.Provider value={{ systemName, systemLogo, updateBranding, loading }}>
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
