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
];

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cleanflow_lang');
    if (saved) setLang(saved);
    setMounted(true);
  }, []);

  const changeLang = (code) => {
    setLang(code);
    localStorage.setItem('cleanflow_lang', code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  if (!mounted) return <>{children}</>;

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) return { lang: 'en', t: (k) => k, changeLang: () => {}, LANGUAGES };
  return ctx;
}
