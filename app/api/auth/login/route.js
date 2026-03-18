import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { verifyPassword, createToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const { identifier, password, email } = await req.json();
    const loginUser = identifier || email;

    if (!loginUser || !password) {
      return NextResponse.json({ error: 'Email/Phone and password are required' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ? OR phone = ?').get(loginUser, loginUser);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      store_id: user.store_id
    };

    const token = await createToken(userPayload);

    // Map db role to frontend role
    let feRole = 'worker';
    if (user.role === 'owner') feRole = 'owner';
    if (user.role === 'manager') feRole = 'admin';

    const cookieStore = await cookies();
    cookieStore.set({
      name: 'cleanflow_session',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return NextResponse.json({ 
      success: true, 
      user: { ...userPayload, role: feRole } 
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
  }
}
