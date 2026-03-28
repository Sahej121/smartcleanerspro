import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cleanflow',
});

export async function GET() {
  try {
    const { rows } = await pool.query(
      'SELECT min_quantity, discount_percent FROM volume_discounts WHERE is_active = TRUE ORDER BY min_quantity DESC'
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Fetch volume discounts error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
