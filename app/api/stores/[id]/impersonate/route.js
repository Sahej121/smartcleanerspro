import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';
import { getSession, signPinToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req, { params }) {
  try {
    const { id } = await params;

    const payload = await getSession();

    // Only owners can impersonate
    if (!payload || payload.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden. Owner access required.' }, { status: 403 });
    }

    // Find a manager user for this store to impersonate
    const res = await query(
      `SELECT * FROM users WHERE store_id = $1 AND role = 'manager' LIMIT 1`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'No admin user found for this store to impersonate.' }, { status: 404 });
    }

    const targetUser = res.rows[0];

    const impersonatedPayload = {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      store_id: targetUser.store_id,
      impersonatedBy: payload.name
    };

    const newToken = await signPinToken(impersonatedPayload);

    // Set the new session cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'cleanflow_pin_session',
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
