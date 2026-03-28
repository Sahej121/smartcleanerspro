import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  try {
    const { type, status, notes } = await request.json();

    if (!['pickup', 'delivery'].includes(type)) {
      return NextResponse.json({ error: 'Invalid logistics type' }, { status: 400 });
    }

    const column = type === 'pickup' ? 'pickup_status' : 'delivery_status';
    
    await query(
      `UPDATE orders SET ${column} = $1, logistics_notes = $2 WHERE id = $3`,
      [status, notes || null, id]
    );

    return NextResponse.json({ message: `${type} status updated to ${status}` });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
