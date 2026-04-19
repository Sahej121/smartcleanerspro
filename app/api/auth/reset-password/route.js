import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? request.headers.get('origin') : 'http://localhost:3000'}/login`,
    });

    if (error) {
      console.error('[RESET] Supabase error:', error.message);
    }

    // For security, always return success regardless of whether the email exists
    return NextResponse.json({ 
      message: 'If an account exists for this email, reset instructions have been sent.' 
    }, { status: 200 });

  } catch (error) {
    console.error('Reset Password Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
