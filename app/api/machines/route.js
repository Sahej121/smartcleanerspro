import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function GET(request) {
  const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const storeIdFilter = auth.user.role === 'owner' ? '' : `WHERE store_id = ${auth.user.store_id || 1}`;

    const { rows } = await query(`
      SELECT m.*, 
        (SELECT COUNT(*) FROM machine_loads ml WHERE ml.machine_id = m.id AND ml.status = 'running') as active_loads
      FROM machines m
      ${storeIdFilter}
      ORDER BY id ASC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch machines:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await requireRole(request, ['owner', 'manager']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { machine_name, machine_type } = await request.json();
    
    if (!machine_name || !machine_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { rows } = await query(
      `INSERT INTO machines (machine_name, machine_type, store_id) 
       VALUES ($1, $2, $3) RETURNING *`,
      [machine_name, machine_type, auth.user.store_id || 1]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create machine:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
