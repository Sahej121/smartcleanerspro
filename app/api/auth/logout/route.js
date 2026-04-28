import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST() {
  try {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Logout error:', error);
  }

  // Build response that explicitly clears all auth cookies
  const response = NextResponse.json({ success: true });

  // Clear the pin-based session cookie
  response.cookies.set('cleanflow_pin_session', '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
  });

  // Clear any Supabase auth cookies by setting them to expired
  // Supabase SSR uses sb-<ref>-auth-token cookie(s)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  let projectRef = '';
  try {
    const hostname = new URL(supabaseUrl).hostname;
    projectRef = hostname.split('.')[0]; // e.g. "abcdefg" from "abcdefg.supabase.co"
  } catch {
    // fallback — we'll clear by common patterns
  }

  if (projectRef) {
    // Clear both the base cookie and chunked cookies (sb-<ref>-auth-token, sb-<ref>-auth-token.0, .1, etc.)
    const cookieNames = [
      `sb-${projectRef}-auth-token`,
      `sb-${projectRef}-auth-token.0`,
      `sb-${projectRef}-auth-token.1`,
      `sb-${projectRef}-auth-token.2`,
    ];
    for (const name of cookieNames) {
      response.cookies.set(name, '', {
        path: '/',
        maxAge: 0,
        httpOnly: true,
        sameSite: 'lax',
      });
    }
  }

  return response;
}
