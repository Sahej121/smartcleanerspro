'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MarketingNavbar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: '/', label: t('home') },
    { href: '/features', label: t('features') },
    { href: '/how-it-works', label: t('how_it_works') },
    { href: '/pricing', label: t('pricing') },
    { href: '/contact', label: t('contact') },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] glass-navbar py-2 opacity-100 transition-all duration-500">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-105" onClick={() => setMenuOpen(false)}>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl primary-gradient text-white shadow-xl shadow-emerald-600/20 group-hover:rotate-6 transition-all duration-500">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          </span>
          <div>
            <p className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Dry Cleaner's flow</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600/70">{t('dry_cleaner_platform')}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-5 py-2 text-sm font-bold transition-all duration-300 ${
                  active
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="relative z-[110] hidden sm:block rounded-full px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors">
            Login
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 md:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div className={`fixed inset-x-0 top-[76px] bg-white/95 backdrop-blur-2xl border-b border-emerald-100 transition-all duration-500 overflow-hidden md:hidden ${
        menuOpen ? 'max-h-[400px] opacity-100 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'
      }`}>
        <nav className="flex flex-col gap-2 p-6">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-2xl px-4 py-3 text-base font-bold transition-all ${
                  active ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-700 active:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <hr className="my-2 border-slate-100" />
          <Link href="/login" onClick={() => setMenuOpen(false)} className="rounded-2xl px-4 py-3 text-base font-bold text-slate-700">
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
