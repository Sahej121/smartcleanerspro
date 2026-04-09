import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const res = await query('SELECT id, name FROM users WHERE email = $1', [email]);
    
    if (res.rows.length === 0) {
      // For security reasons, don't reveal if user exists or not
      return NextResponse.json({ 
        message: 'If an account exists for this email, reset instructions have been sent.' 
      }, { status: 200 });
    }

    const user = res.rows[0];

    // Simulate sending email
    console.log(`[SIMULATION] Sending password reset instructions to ${user.name} at ${email}`);

    return NextResponse.json({ 
      message: 'Reset instructions sent. Please check your inbox (including spam).' 
    }, { status: 200 });

  } catch (error) {
    console.error('Reset Password Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
