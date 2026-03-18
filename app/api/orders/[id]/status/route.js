import { getDb } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  try {
    const db = getDb();
    const { id } = await params;
    const { status } = await request.json();

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);

    // If order is delivered/ready, update all items too
    if (status === 'delivered' || status === 'ready') {
      db.prepare('UPDATE order_items SET status = ? WHERE order_id = ?').run(status, id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
