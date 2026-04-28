import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db/db';

export async function PATCH(req) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { language } = body;

    if (!language) {
      return NextResponse.json({ error: 'Language is required' }, { status: 400 });
    }

    await query(
      'UPDATE users SET language = $1 WHERE id = $2',
      [language, session.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PROFILE PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
