'use client';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function MarketingFooter() {
  const { t } = useLanguage();
  return (
    <footer className="relative mt-20 md:mt-40">
      <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-3xl -z-10" />
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl primary-gradient text-white shadow-lg shadow-emerald-600/20">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            </span>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">DrycleanersFlow</h3>
          </div>
          <p className="max-w-md text-base text-slate-600 font-medium leading-relaxed">
            Revolutionizing dry cleaning operations with advanced logistics, intelligent customer engagement, and a role-based POS system designed for the modern atelier.
          </p>
          <div className="mt-8 flex gap-4">
            {['Twitter', 'LinkedIn', 'Instagram'].map(social => (
              <div key={social} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all cursor-pointer">
                <span className="material-symbols-outlined text-lg">public</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="md:col-span-3">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600/80 mb-6">{t('platform')}</p>
          <div className="flex flex-col gap-4 text-base font-bold">
            {[
              { href: '/features', label: t('features') },
              { href: '/how-it-works', label: t('how_it_works') },
              { href: '/pricing', label: t('pricing') },
              { href: '/contact', label: t('contact') },
              { href: '/policy', label: t('policy') },
            ].map(link => (
              <Link key={link.href} href={link.href} className="text-slate-600 hover:text-emerald-600 transition-colors w-fit">{link.label}</Link>
            ))}
          </div>
        </div>
        
        <div className="md:col-span-4">
          <div className="glass-card-matte p-8 rounded-[2rem] border-sky-100 bg-sky-50/30">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600 mb-2">Newsletter</p>
            <h4 className="text-lg font-black text-slate-900 mb-4">Get the latest business tips</h4>
            <div className="flex gap-2">
              <input type="email" placeholder="Email address" className="bg-white border border-sky-100 rounded-xl px-4 py-2 text-sm w-full outline-none focus:border-sky-300 transition-all font-medium" />
              <button className="bg-sky-600 text-white rounded-xl px-4 py-2 text-sm font-black hover:bg-sky-700 transition-all">{t('join')}</button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-slate-200/50 bg-white/50 backdrop-blur -z-10 px-6 py-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-bold text-slate-500">
            © {new Date().getFullYear()} DrycleanersFlow. {t('built_for_ateliers')}
          </p>
          <div className="flex gap-8 text-sm font-bold text-slate-400">
            <Link href="/terms" className="hover:text-slate-600">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-600">Privacy</Link>
            <Link href="/cookies" className="hover:text-slate-600">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
