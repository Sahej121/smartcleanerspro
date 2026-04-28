import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function GET(request) {
  const auth = await requireRole(request, ['owner', 'manager', 'frontdesk']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  try {
    const statusRes = await query(
      `SELECT status, COUNT(*) as count 
       FROM orders 
       WHERE created_at >= $1 AND created_at <= $2 AND store_id = $3
       GROUP BY status`,
      [start || '1970-01-01', end || '2100-01-01', auth.user.store_id]
    );

    return NextResponse.json(statusRes.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
