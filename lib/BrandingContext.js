'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const BrandingContext = createContext();

export function BrandingProvider({ children }) {
  const [systemName, setSystemName] = useState('CleanFlow');
  const [systemLogo, setSystemLogo] = useState('C');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedName = localStorage.getItem('cleanflow_system_name');
    const savedLogo = localStorage.getItem('cleanflow_system_logo');
    
    if (savedName) setSystemName(savedName);
    if (savedLogo) setSystemLogo(savedLogo);
    
    setLoading(false);
  }, []);

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
