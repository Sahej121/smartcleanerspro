import { getDb } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getDb();
    const pricing = db.prepare('SELECT * FROM pricing ORDER BY garment_type, service_type').all();
    return NextResponse.json(pricing);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { garment_type, service_type, price } = body;

    const result = db.prepare('INSERT INTO pricing (garment_type, service_type, price) VALUES (?, ?, ?)')
      .run(garment_type, service_type, price);
    
    return NextResponse.json({ id: result.lastInsertRowid, garment_type, service_type, price });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, price } = body;

    db.prepare('UPDATE pricing SET price = ? WHERE id = ?').run(price, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
