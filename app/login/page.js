'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/UserContext';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { fetchUser, user } = useUser();

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.push('/');
  }, [user, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (res.ok) {
        await fetchUser();
        router.push('/');
      } else {
        setError(data.error || 'Identity verification failed');
      }
    } catch (err) {
      setError('An encrypted connection error occurred');
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
        <div className="glass-panel p-10 rounded-[3rem] border border-white bg-white/40 shadow-[0_32px_64px_-16px_rgba(11,28,48,0.1)]">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-[1.5rem] primary-gradient flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-emerald-900/20 mx-auto mb-6 transition-transform hover:scale-110 breathe-glow">
              C
            </div>
            <h1 className="text-3xl font-black text-on-surface font-headline uppercase tracking-tight mb-2">CleanFlow</h1>
            <p className="text-xs font-black text-on-surface-variant uppercase tracking-[0.3em]">Atelier Management</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-fade-in-down" style={{ animationDuration: '0.3s' }}>
              <span className="material-symbols-outlined text-lg">error</span>
              <p className="text-[11px] font-black uppercase tracking-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">System Identity</label>
              <div className="relative group">
                <span className={`material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-xl transition-colors duration-300 ${identifier ? 'text-primary' : 'text-slate-300 group-focus-within:text-primary'}`}>person</span>
                <input 
                  type="text" 
                  className="w-full bg-white/100 border border-transparent rounded-2xl py-4 pl-14 pr-6 text-sm font-bold shadow-inner transition-all duration-300 placeholder:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-white focus:shadow-lg focus:shadow-primary/5 outline-none"
                  value={identifier} 
                  onChange={e => setIdentifier(e.target.value)}
                  required 
                  placeholder="Email or phone reference"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Access Key</label>
                <button type="button" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Forgot?</button>
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
              className="w-full primary-gradient text-white py-5 rounded-[2rem] font-black text-sm shadow-2xl shadow-emerald-900/10 hover:shadow-emerald-900/30 active:scale-95 transition-all mt-4 disabled:opacity-50 overflow-hidden relative group shimmer-btn"
              disabled={loading}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                    AUTHENTICATING...
                  </>
                ) : 'AUTHORIZE ACCESS'}
              </span>
            </button>
          </form>

          <div className="text-center mt-10">
            <p className="text-[11px] font-bold text-slate-400">
              New to the Atelier? <button onClick={() => router.push('/signup')} className="text-primary font-black hover:underline ml-1">REGISTER</button>
            </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Pristine v2.4.0-stable</p>
      </div>
    </div>
  );
}
