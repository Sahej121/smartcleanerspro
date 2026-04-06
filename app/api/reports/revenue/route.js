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
    let whereClause = "WHERE p.created_at >= $1 AND p.created_at <= $2 AND o.store_id = $3";
    let params = [start || '1970-01-01', end || '2100-01-01', auth.user.store_id];

    const revenueRes = await query(
      `SELECT payment_method as method, SUM(amount) as total 
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       ${whereClause}
       GROUP BY payment_method`,
      params
    );

    const dailyRes = await query(
      `SELECT DATE(p.created_at) as date, SUM(amount) as total
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       ${whereClause}
       GROUP BY DATE(p.created_at)
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
