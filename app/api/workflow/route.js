import { getDb } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getDb();

    const stages = ['received', 'sorting', 'washing', 'dry_cleaning', 'drying', 'ironing', 'quality_check', 'ready'];
    const result = {};

    for (const stage of stages) {
      const items = db.prepare(`
        SELECT oi.*, o.order_number, c.name as customer_name
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE oi.status = ?
        ORDER BY oi.created_at ASC
      `).all(stage);
      result[stage] = items;
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
