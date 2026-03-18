import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { verifyToken, createToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('cleanflow_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);

    // Only owners can impersonate
    if (!payload || payload.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden. Owner access required.' }, { status: 403 });
    }

    const db = getDb();
    
    // Find a manager user for this store to impersonate
    const targetUser = db.prepare(`
      SELECT * FROM users WHERE store_id = ? AND role = 'manager' LIMIT 1
    `).get(id);

    if (!targetUser) {
      return NextResponse.json({ error: 'No admin user found for this store to impersonate.' }, { status: 404 });
    }

    const impersonatedPayload = {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      store_id: targetUser.store_id,
      impersonatedBy: payload.name
    };

    const newToken = await createToken(impersonatedPayload);

    // Set the new session cookie
    cookieStore.set({
      name: 'cleanflow_session',
      value: newToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 // 1 hour for impersonation
    });

    return NextResponse.json({ 
      success: true, 
      message: `Now impersonating ${targetUser.name} at ${id}`,
      redirect: '/'
    });

  } catch (error) {
    console.error('Impersonation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
