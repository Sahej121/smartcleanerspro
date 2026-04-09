'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, ROLES } from '@/lib/UserContext';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLES.STAFF);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { fetchUser } = useUser();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (res.ok) {
        await fetchUser();
        router.push('/');
      } else {
        setError(data.error || 'Identity creation failed');
      }
    } catch (err) {
      setError('A secure connection error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/30 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="glass-panel p-10 rounded-[3.5rem] border border-white bg-white/40 shadow-[0_32px_64px_-16px_rgba(11,28,48,0.1)]">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-[1.5rem] primary-gradient flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-emerald-900/20 mx-auto mb-6 transition-transform hover:scale-110">
              C
            </div>
            <h1 className="text-3xl font-black text-on-surface font-headline uppercase tracking-tight mb-2">Join CleanFlow</h1>
            <p className="text-xs font-black text-on-surface-variant uppercase tracking-[0.3em]">Create Atelier Profile</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-lg">error</span>
              <p className="text-[11px] font-black uppercase tracking-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Full Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg">person</span>
                <input 
                  type="text" 
                  className="w-full bg-white/80 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold shadow-inner focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-200"
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  required 
                  placeholder="Christian Dior"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Digital Identity</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg">mail</span>
                <input 
                  type="email" 
                  className="w-full bg-white/80 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold shadow-inner focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-200"
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  required 
                  placeholder="dior@atelier.io"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Security Key</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg">lock</span>
                <input 
                  type="password" 
                  className="w-full bg-white/80 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold shadow-inner focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-200"
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  required 
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Workspace Role</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg">admin_panel_settings</span>
                <select 
                  className="w-full bg-white/80 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold shadow-inner focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  value={role} 
                  onChange={e => setRole(e.target.value)}
                >
                  <option value={ROLES.ADMIN}>Atelier Manager (Admin)</option>
                  <option value={ROLES.STAFF}>Floor Specialist (Staff)</option>
                </select>
                <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">expand_more</span>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full primary-gradient text-white py-5 rounded-[2.5rem] font-black text-sm shadow-2xl shadow-emerald-900/10 hover:shadow-emerald-900/30 active:scale-95 transition-all mt-4 disabled:opacity-50 overflow-hidden relative group"
              disabled={loading}
            >
              <span className="relative z-10">{loading ? 'CREATING IDENTITY...' : 'INITIALIZE PROFILE'}</span>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500 skew-x-12"></div>
            </button>
          </form>

          <div className="text-center mt-10">
            <p className="text-[11px] font-bold text-slate-400">
              Already have a profile? <button onClick={() => router.push('/login')} className="text-primary font-black hover:underline ml-1">SIGN IN</button>
            </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Pristine Atelier v2.4.0</p>
      </div>
    </div>
  );
}
