'use client';

import MasterControl from '@/components/dashboards/MasterControl';
import { useUser, ROLES } from '@/lib/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MasterNodesPage() {
  const { role, user, loading } = useUser();
  const router = useRouter();
  const isSaasOwner = user?.id === 1 && role === ROLES.OWNER;

  useEffect(() => {
    if (!loading && !isSaasOwner) {
      router.push('/');
    }
  }, [isSaasOwner, loading, router]);

  if (loading || !isSaasOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Initializing Master Control...</p>
      </div>
    );
  }

  return <MasterControl user={user} />;
}
