'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBranding } from '@/lib/BrandingContext';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { systemName } = useBranding();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('This reset link is invalid or incomplete.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || 'Password reset complete. You can now sign in.');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => router.push('/login'), 1200);
      } else {
        setError(data.error || 'Unable to reset password.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-6 relative overflow-y-auto overflow-x-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/30 blur-[120px] rounded-full animate-float-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-float-slow" style={{ animationDelay: '4s' }}></div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up" style={{ animationDuration: '0.8s' }}>
        <div className="mb-4 flex justify-center">
          <Link href="/login" className="rounded-full border border-emerald-100 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            Back to Login
          </Link>
        </div>

        <div className="glass-panel p-10 rounded-[3rem] border border-white bg-white/40 shadow-[0_32px_64px_-16px_rgba(11,28,48,0.1)]">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-[1.5rem] primary-gradient flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-emerald-900/20 mx-auto mb-6">
              C
            </div>
            <h1 className="text-3xl font-black text-on-surface font-headline uppercase tracking-tight mb-2">{systemName}</h1>
            <p className="text-xs font-black text-on-surface-variant uppercase tracking-[0.3em]">Reset Password</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
              <span className="material-symbols-outlined text-lg">error</span>
              <p className="text-[11px] font-black uppercase tracking-tight">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <p className="text-[11px] font-black uppercase tracking-tight">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">New Password</label>
              <div className="relative group">
                <span className={`material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-xl transition-colors duration-300 ${password ? 'text-primary' : 'text-slate-300 group-focus-within:text-primary'}`}>lock</span>
                <input
                  type="password"
                  className="w-full bg-white/100 border border-transparent rounded-2xl py-4 pl-14 pr-6 text-sm font-bold shadow-inner transition-all duration-300 placeholder:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-white focus:shadow-lg focus:shadow-primary/5 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Confirm Password</label>
              <div className="relative group">
                <span className={`material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-xl transition-colors duration-300 ${confirmPassword ? 'text-primary' : 'text-slate-300 group-focus-within:text-primary'}`}>verified_user</span>
                <input
                  type="password"
                  className="w-full bg-white/100 border border-transparent rounded-2xl py-4 pl-14 pr-6 text-sm font-bold shadow-inner transition-all duration-300 placeholder:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-white focus:shadow-lg focus:shadow-primary/5 outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Repeat your new password"
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
                    Updating...
                  </>
                ) : 'Update Password'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
