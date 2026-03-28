import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await query('SELECT * FROM pricing ORDER BY garment_type, service_type');
    return NextResponse.json(res.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { garment_type, service_type, price } = body;

    const res = await query(
      'INSERT INTO pricing (garment_type, service_type, price) VALUES ($1, $2, $3) RETURNING *',
      [garment_type, service_type, price]
    );
    
    return NextResponse.json(res.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, price } = body;

    await query('UPDATE pricing SET price = $1 WHERE id = $2', [price, id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
