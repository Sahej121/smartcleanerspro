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

    // Disable public signups (invite-only / admin-created flow)
    return NextResponse.json({ error: 'Public signup is disabled. Please ask your store owner for an account.' }, { status: 403 });



  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}
