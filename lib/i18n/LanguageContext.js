'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'ar', name: 'العربية' },
  { code: 'zh', name: '中文' },
  { code: 'pt', name: 'Português' },
  { code: 'mi', name: 'Te Reo Māori' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'te', name: 'తెలుగు' },
];

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const init = async () => {
      // 1. Try to get from session first (DB Source of Truth)
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.language) {
            setLang(data.user.language);
            localStorage.setItem('cleanflow_lang', data.user.language);
            document.documentElement.dir = data.user.language === 'ar' ? 'rtl' : 'ltr';
            setMounted(true);
            return;
          }
        }
      } catch (e) { console.error('Failed to fetch lang from session', e); }

      // 2. Fallback to localStorage
      const saved = localStorage.getItem('cleanflow_lang');
      if (saved) {
        setLang(saved);
        document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
      }
      setMounted(true);
    };
    
    init();
  }, []);

  const changeLang = async (code) => {
    setLang(code);
    localStorage.setItem('cleanflow_lang', code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    
    // Sync to DB
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: code })
      });
    } catch (e) { console.error('Failed to sync lang to DB', e); }
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t, LANGUAGES, mounted }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) return { lang: 'en', t: (k) => k, changeLang: () => {}, LANGUAGES };
  return ctx;
}
