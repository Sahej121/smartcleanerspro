import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';

export async function GET() {
  try {
    const { rows } = await query(
      'SELECT min_quantity, discount_percent FROM volume_discounts WHERE is_active = TRUE ORDER BY min_quantity DESC'
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Fetch volume discounts error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
