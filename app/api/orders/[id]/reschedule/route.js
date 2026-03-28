import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  try {
    const { pickup_date, delivery_date } = await request.json();

    const updates = [];
    const params_vals = [];
    let pIdx = 1;

    if (pickup_date) {
      updates.push(`pickup_date = $${pIdx++}`);
      params_vals.push(pickup_date);
    }
    if (delivery_date) {
      updates.push(`delivery_date = $${pIdx++}`);
      params_vals.push(delivery_date);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No reschedule data provided' }, { status: 400 });
    }

    params_vals.push(id);
    await query(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = $${pIdx}`,
      params_vals
    );

    return NextResponse.json({ message: 'Order rescheduled successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
