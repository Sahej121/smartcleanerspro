import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function GET(request) {
  const auth = await requireRole(request, ['owner', 'manager']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  try {
    const staffRes = await query(
      `SELECT u.name, COUNT(o.id) as orders_created, COALESCE(SUM(o.total_amount), 0) as total_value
       FROM users u
       LEFT JOIN orders o ON u.id = o.created_by AND o.created_at >= $1 AND o.created_at <= $2 AND o.store_id = $3
       WHERE u.store_id = $3
       GROUP BY u.id, u.name
       ORDER BY orders_created DESC`,
      [start || '1970-01-01', end || '2100-01-01', auth.user.store_id]
    );

    return NextResponse.json(staffRes.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
