'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { fetchUser } = useUser();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setErrorMsg('No session ID provided. If you completed payment, please contact support.');
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch('/api/payments/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        });

        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          await fetchUser(); // reload user data now that store is active
        } else {
          setStatus('error');
          setErrorMsg(data.error || 'Payment verification failed.');
        }
      } catch (err) {
        setStatus('error');
        setErrorMsg('A network error occurred while verifying your payment.');
      }
    };

    verifyPayment();
  }, [sessionId, fetchUser]);

  return (
    <div className="glass-panel p-10 rounded-[3.5rem] border border-white bg-white/40 shadow-[0_32px_64px_-16px_rgba(11,28,48,0.1)] text-center max-w-md w-full">
      {status === 'verifying' && (
        <div className="space-y-6">
          <div className="w-16 h-16 mx-auto border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <h1 className="text-2xl font-black text-emerald-950 font-headline uppercase tracking-tight">Verifying Payment</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Please don't close this window...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-6 animate-in zoom-in duration-500">
          <div className="w-20 h-20 mx-auto bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
          <h1 className="text-3xl font-black text-emerald-950 font-headline uppercase tracking-tight">Welcome to CleanFlow</h1>
          <p className="text-sm font-bold text-slate-500">Your atelier profile has been created and activated successfully!</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full primary-gradient text-white py-5 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all mt-6"
          >
            Go to Dashboard
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
          <div className="w-20 h-20 mx-auto bg-red-100 text-red-500 rounded-full flex items-center justify-center border-4 border-red-50">
            <span className="material-symbols-outlined text-4xl">error</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-headline uppercase tracking-tight">Verification Failed</h1>
          <p className="text-xs font-bold text-slate-500">{errorMsg}</p>
          <Link href="/contact" className="block text-emerald-600 font-black text-sm uppercase tracking-widest hover:underline mt-4">
            Contact Support
          </Link>
        </div>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-6 relative overflow-y-auto overflow-x-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/30 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>

      <Suspense fallback={<div className="text-emerald-600 animate-pulse font-black uppercase tracking-widest">Verifying Checkout...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
