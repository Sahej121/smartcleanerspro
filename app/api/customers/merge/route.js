import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function POST(request) {
  const auth = await requireRole(request, ['owner', 'manager']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { source_id, target_id } = await request.json();

    if (!source_id || !target_id || source_id === target_id) {
      return NextResponse.json({ error: 'Invalid source or target ID' }, { status: 400 });
    }

    // Start a transaction would be better, but we'll use sequential queries for now with basic safety
    // Verification
    const [source, target] = await Promise.all([
      query('SELECT * FROM customers WHERE id = $1', [source_id]),
      query('SELECT * FROM customers WHERE id = $1', [target_id])
    ]);

    if (source.rows.length === 0 || target.rows.length === 0) {
      return NextResponse.json({ error: 'One or both customers not found' }, { status: 404 });
    }

    // 1. Move all orders
    await query('UPDATE orders SET customer_id = $1 WHERE customer_id = $2', [target_id, source_id]);

    // 2. Aggregate loyalty points
    const sourcePoints = source.rows[0].loyalty_points || 0;
    if (sourcePoints > 0) {
      await query('UPDATE customers SET loyalty_points = loyalty_points + $1 WHERE id = $2', [sourcePoints, target_id]);
    }

    // 3. Delete source
    await query('DELETE FROM customers WHERE id = $1', [source_id]);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully merged customer ID ${source_id} into ${target_id}.`,
      target_id 
    });

  } catch (error) {
    console.error('Merge error:', error);
    return NextResponse.json({ error: 'Failed to consolidate records: ' + error.message }, { status: 500 });
  }
}
