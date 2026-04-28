'use client';

import { useState } from 'react';

export default function AgentLogin({ onLoginSuccess }) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: phone, password: pin }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 border border-slate-100 animate-scale-in">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              delivery_dining
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2 font-headline">Agent Access</h1>
          <p className="text-slate-500 font-medium text-center">Login with your registered phone number and PIN to start pickups.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2 mb-2 block">Phone Number</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300">phone_iphone</span>
              <input 
                type="tel"
                required
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-slate-300"
                placeholder="Enter 10-digit phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2 mb-2 block">Security PIN</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300">lock</span>
              <input 
                type="password"
                required
                maxLength={6}
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-slate-300 tracking-[0.5em]"
                placeholder="••••"
                value={pin}
                onChange={e => setPin(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Secure Login</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <p className="mt-10 text-center text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">
          Powered by CleanFlow AI
        </p>
      </div>
    </div>
  );
}
