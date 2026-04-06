import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { query } from '@/lib/db/db';

export async function GET() {
  const cookieStore = await cookies();
  const token = (await cookieStore).get('cleanflow_session')?.value;
  console.log('[ME] Token received:', !!token);

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const payload = await verifyToken(token);
  console.log('[ME] Payload verified:', !!payload);

  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Check Store Status and Tier
  let isSuspended = false;
  let tier = 'starter';
  if (payload.store_id) {
    const res = await query('SELECT status, subscription_tier FROM stores WHERE id = $1', [payload.store_id]);
    const store = res.rows[0];
    if (store) {
      if (store.status === 'suspended') isSuspended = true;
      tier = store.subscription_tier || 'starter';
    }
  }

  // Map db role to frontend role (preserve specializing roles)
  let feRole = payload.role;
  if (payload.role === 'manager') feRole = 'admin';
  // Note: frontdesk, driver, staff remain as is

  return NextResponse.json({ 
    user: { ...payload, role: feRole, suspended: isSuspended, tier } 
  });
}
