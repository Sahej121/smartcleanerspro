import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('cleanflow_session')?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Map db role to frontend role
  let feRole = 'worker';
  if (payload.role === 'owner') feRole = 'owner';
  if (payload.role === 'manager') feRole = 'admin';

  return NextResponse.json({ 
    user: { ...payload, role: feRole } 
  });
}
