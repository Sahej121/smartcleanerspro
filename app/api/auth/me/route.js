import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // getSession() handles both Supabase Auth sessions AND PIN-based sessions
    const session = await getSession();

    if (!session) {
      console.log('[ME] No session found');
      return NextResponse.json({ user: null }, { status: 401 });
    }

    console.log(`[ME] Session found - Type: ${session.type}, ID: ${session.id}, Role: ${session.role}`);

    // For Supabase sessions, session already has full app data including suspension status.
    // For PIN sessions, session comes from the JWT payload + quick DB check.
    // In both cases we have id, name, email, role, store_id, tier, suspended.

    // Map db role to frontend role (preserve specializing roles)
    let feRole = session.role;
    if (session.role === 'manager') feRole = 'admin';

    return NextResponse.json({ 
      user: {
        id: session.id,
        name: session.name,
        email: session.email,
        role: feRole,
        store_id: session.store_id,
        tier: session.tier,
        suspended: session.suspended,
        auth_id: session.auth_id || null,
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });

  } catch (error) {
    console.error('[ME] Error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
