import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    await query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);

    // If order is delivered/ready, update all items too
    if (status === 'delivered' || status === 'ready') {
      await query('UPDATE order_items SET status = $1 WHERE order_id = $2', [status, id]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
