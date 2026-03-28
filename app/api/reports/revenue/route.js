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
    let whereClause = "WHERE p.created_at >= $1 AND p.created_at <= $2";
    let params = [start || '1970-01-01', end || '2100-01-01'];

    const revenueRes = await query(
      `SELECT method, SUM(amount) as total 
       FROM payments p
       ${whereClause}
       GROUP BY method`,
      params
    );

    const dailyRes = await query(
      `SELECT DATE(created_at) as date, SUM(amount) as total
       FROM payments p
       ${whereClause}
       GROUP BY DATE(created_at)
       ORDER BY date`,
      params
    );

    return NextResponse.json({
      byMethod: revenueRes.rows,
      daily: dailyRes.rows
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
