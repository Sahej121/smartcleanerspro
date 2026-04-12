import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';
import { verifyPassword, createToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { normalizeTier } from '@/lib/tier-config';

export async function POST(req) {
  try {
    const { identifier, password, email } = await req.json();
    const loginUser = identifier || email;

    if (!loginUser || !password) {
      return NextResponse.json({ error: 'Email/Phone and password are required' }, { status: 400 });
    }

    console.log('[LOGIN] Attempting login for:', loginUser);
    const res = await query('SELECT * FROM users WHERE email = $1 OR phone = $2', [loginUser, loginUser]);
    const user = res.rows[0];

    if (!user) {
      console.log('[LOGIN] User not found:', loginUser);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    let isValid = false;
    if (user.password_hash) {
      isValid = await verifyPassword(password, user.password_hash);
    }

    // Fallback to PIN check if password fails and a pin is provided
    if (!isValid && user.pin_hash && password.length === 4) {
      isValid = await verifyPassword(password, user.pin_hash);
    }

    console.log('[LOGIN] Auth valid:', isValid);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Fetch store tier for feature gating
    let tier = 'software_only';
    if (user.store_id) {
      const storeRes = await query('SELECT subscription_tier FROM stores WHERE id = $1', [user.store_id]);
      tier = normalizeTier(storeRes.rows[0]?.subscription_tier);
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      store_id: user.store_id,
      tier
    };

    const token = await createToken(userPayload);
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
      user: userPayload
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
  }
}
