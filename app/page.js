'use client';

import { useUser, ROLES } from '@/lib/UserContext';
import StoreAdmin from '@/components/dashboards/StoreAdmin';
import MasterControl from '@/components/dashboards/MasterControl';
import StaffOperations from '@/components/dashboards/StaffOperations';

export default function DashboardPage() {
  const { role, user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Initializing Pristine Atelier...</p>
      </div>
    );
  }

  // Switch based on ROLES from UserContext
  if (role === ROLES.OWNER) {
    return <MasterControl user={user} />;
  }

  if ([ROLES.STAFF, ROLES.FRONTDESK, ROLES.DRIVER].includes(role)) {
    return <StaffOperations user={user} />;
  }

  // Default to Store Admin (Managers or fallback)
  return <StoreAdmin user={user} />;
}
