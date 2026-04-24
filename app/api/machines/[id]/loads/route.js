import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function GET(request, { params }) {
  const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;

  try {
    const { rows } = await query(`
      SELECT ml.*, oi.garment_type, oi.tag_id, o.order_number 
      FROM machine_loads ml
      LEFT JOIN order_items oi ON ml.order_item_id = oi.id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE ml.machine_id = $1
      ORDER BY ml.start_time DESC
      LIMIT 50
    `, [id]);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch machine loads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const auth = await requireRole(request, ['owner', 'manager', 'staff']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;

  try {
    const { action, order_item_id } = await request.json(); // action can be 'start' or 'complete'
    
    if (action === 'start') {
      // Find garment by tag if order_item_id isn't provided directly
      if (!order_item_id) {
         return NextResponse.json({ error: 'Please provide order_item_id to load' }, { status: 400 });
      }

      await query(
        `INSERT INTO machine_loads (machine_id, order_item_id, start_time, status) VALUES ($1, $2, NOW(), 'running')`,
        [id, order_item_id]
      );
      
      // Update machine status
      await query(`UPDATE machines SET status = 'running' WHERE id = $1`, [id]);

      return NextResponse.json({ message: 'Machine load started' });
    } 
    else if (action === 'complete') {
      // Complete all running loads for this machine
      await query(
        `UPDATE machine_loads SET status = 'completed', end_time = NOW() WHERE machine_id = $1 AND status = 'running'`,
        [id]
      );
      
      // Update machine status
      await query(`UPDATE machines SET status = 'idle' WHERE id = $1`, [id]);

      return NextResponse.json({ message: 'Machine load completed' });
    } 
    else {
      return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
    }
  } catch (error) {
    console.error('Failed to update machine load:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
