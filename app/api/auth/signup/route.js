import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';
import { hashPassword, createToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (role === 'owner') {
      return NextResponse.json({ error: 'Owner accounts cannot be created via signup.' }, { status: 403 });
    }

    // Default to store 1 for MVP
    const store_id = 1;

    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    // Map frontend roles to db roles
    let dbRole = 'staff';
    if (role === 'owner') dbRole = 'owner';
    else if (role === 'admin') dbRole = 'manager';
    else if (role === 'worker') dbRole = 'staff';

    const info = await query(
      `INSERT INTO users (name, email, password_hash, role, store_id) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, email, hashedPassword, dbRole, store_id]
    );

    // Create session
    const userPayload = {
      id: info.rows[0].id,
      name,
      email,
      role: dbRole,
      store_id
    };

    const token = await createToken(userPayload);
    
    // Convert to frontend role for context consistency
    let feRole = 'worker';
    if (dbRole === 'owner') feRole = 'owner';
    if (dbRole === 'manager') feRole = 'admin';

    // Set HTTP-only cookie
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
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}
