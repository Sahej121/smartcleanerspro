import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';
import { requireRole } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = await requireRole(req, ['owner']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const res = await query('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 50');
    return NextResponse.json(res.rows);

  } catch (error) {
    console.error('[API LOGS] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
