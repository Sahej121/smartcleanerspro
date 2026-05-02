import { query } from '@/lib/db/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import StaffClient from './StaffClient';

export const metadata = {
  title: 'Staff Management | CleanFlow',
};

export default async function StaffPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const allowedRoles = ['owner', 'manager', 'superadmin'];
  if (!allowedRoles.includes(session.role)) {
    redirect('/');
  }

  // Fetch staff data directly on the server
  const res = await query(`
    SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at, s.store_name
    FROM users u
    LEFT JOIN stores s ON u.store_id = s.id
    WHERE u.store_id = $1 AND u.role != 'owner'
    ORDER BY u.created_at DESC
  `, [session.store_id]);

  return <StaffClient initialStaff={res.rows} />;
}
