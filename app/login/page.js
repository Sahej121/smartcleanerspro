'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import { normalizeTier } from '@/lib/tier-config';
import Link from 'next/link';
import { useBranding } from '@/lib/BrandingContext';

export default function LoginPage() {
  const { t } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const router = useRouter();
  const { user, login } = useUser();
  const { systemName } = useBranding();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) router.push('/');
  }, [user, router, loading]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Map backend worker to frontend staff
        const userData = {
          ...data.user,
          role: data.user.role === 'manager' ? 'admin' : data.user.role
        };
        login(userData);
        router.push('/waiting?origin=login');
      } else {
        setError(data.error || t('login_failed'));
      }
    } catch (err) {
      setError(t('network_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetMessage(data.message || t('reset_sent'));
      } else {
        setError(data.error || t('reset_failed'));
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/30 blur-[120px] rounded-full animate-float-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-float-slow" style={{ animationDelay: '4s' }}></div>
      <div className="absolute top-[30%] right-[10%] w-[20%] h-[20%] bg-emerald-200/20 blur-[80px] rounded-full animate-float-slow" style={{ animationDelay: '8s' }}></div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up" style={{ animationDuration: '0.8s' }}>
        <div className="mb-4 flex justify-center">
          <Link href="/" className="rounded-full border border-emerald-100 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            Back to Website
          </Link>
        </div>
        <div className="glass-panel p-10 rounded-[3rem] border border-white bg-white/40 shadow-[0_32px_64px_-16px_rgba(11,28,48,0.1)]">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-[1.5rem] primary-gradient flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-emerald-900/20 mx-auto mb-6 transition-transform hover:scale-110 breathe-glow">
              C
            </div>
            <h1 className="text-3xl font-black text-on-surface font-headline uppercase tracking-tight mb-2">{systemName}</h1>
            <p className="text-xs font-black text-on-surface-variant uppercase tracking-[0.3em]">{t('atelier_management')}</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-fade-in-down" style={{ animationDuration: '0.3s' }}>
              <span className="material-symbols-outlined text-lg">error</span>
              <p className="text-[11px] font-black uppercase tracking-tight">{error}</p>
            </div>
          )}

          {showForgot ? (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">{t('account_email')}</label>
                <div className="relative group">
                  <span className={`material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-xl transition-colors duration-300 ${resetEmail ? 'text-primary' : 'text-slate-300 group-focus-within:text-primary'}`}>mail</span>
                  <input 
                    type="email" 
                    className="w-full bg-white/100 border border-transparent rounded-2xl py-4 pl-14 pr-6 text-sm font-bold shadow-inner transition-all duration-300 placeholder:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-white focus:shadow-lg focus:shadow-primary/5 outline-none"
                    value={resetEmail} 
                    onChange={e => setResetEmail(e.target.value)}
                    required 
                    placeholder={t('email_placeholder')}
                  />
                </div>
              </div>

              {resetMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 animate-fade-in-down">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <p className="text-[11px] font-black uppercase tracking-tight">{resetMessage}</p>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full primary-gradient text-white py-5 rounded-[2rem] font-black text-sm shadow-2xl shadow-emerald-900/10 hover:shadow-emerald-900/30 active:scale-95 transition-all mt-4 disabled:opacity-50 overflow-hidden relative group"
                disabled={loading}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                      {t('sending')}
                    </>
                  ) : t('send_reset_link')}
                </span>
              </button>
              
              <div className="text-center mt-4">
                <button type="button" onClick={() => { setShowForgot(false); setResetMessage(''); setError(''); }} className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">
                  RETURN TO LOGIN
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">{t('system_identity')}</label>
                <div className="relative group">
                  <span className={`material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-xl transition-colors duration-300 ${identifier ? 'text-primary' : 'text-slate-300 group-focus-within:text-primary'}`}>person</span>
                  <input 
                    type="text" 
                    className="w-full bg-white/100 border border-transparent rounded-2xl py-4 pl-14 pr-6 text-sm font-bold shadow-inner transition-all duration-300 placeholder:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-white focus:shadow-lg focus:shadow-primary/5 outline-none"
                    value={identifier} 
                    onChange={e => setIdentifier(e.target.value)}
                    required 
                    placeholder={t('login_identifier_placeholder')}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('access_key')}</label>
                  <button type="button" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline" onClick={() => setShowForgot(true)}>{t('forgot_password')}</button>
                </div>
                <div className="relative group">
                  <span className={`material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-xl transition-colors duration-300 ${password ? 'text-primary' : 'text-slate-300 group-focus-within:text-primary'}`}>lock</span>
                  <input 
                    type="password" 
                    className="w-full bg-white/100 border border-transparent rounded-2xl py-4 pl-14 pr-6 text-sm font-bold shadow-inner transition-all duration-300 placeholder:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-white focus:shadow-lg focus:shadow-primary/5 outline-none"
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    required 
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full primary-gradient text-white py-5 rounded-[2rem] font-black text-sm shadow-2xl shadow-emerald-900/10 hover:shadow-emerald-900/30 active:scale-95 transition-all mt-4 disabled:opacity-50 overflow-hidden relative group"
                disabled={loading}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                      AUTHENTICATING...
                    </>
                  ) : t('authorize_access')}
                </span>
              </button>
            </form>
          )}

          <div className="text-center mt-10">
            <p className="text-[11px] font-bold text-slate-400">
              New to the Atelier? <button onClick={() => router.push('/pricing')} className="text-primary font-black hover:underline ml-1">{t('register')}</button>
            </p>
            <p className="mt-2 text-[11px] font-bold text-slate-400">
              Looking for plans first? <Link href="/pricing" className="text-primary font-black hover:underline ml-1">{t('view_pricing')}</Link>
            </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Pristine v2.4.0-stable</p>
      </div>
    </div>
  );
}
