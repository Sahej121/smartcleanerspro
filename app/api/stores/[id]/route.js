import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function PATCH(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('cleanflow_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);

    // Only owners or the manager of this store should be able to edit it
    if (!payload || (payload.role !== 'owner' && payload.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { store_name, city, address, phone } = body;

    // Check ownership or assignment
    const storeCheck = await query(`SELECT owner_id FROM stores WHERE id = $1`, [id]);
    if (storeCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (payload.role === 'owner' && payload.id !== 1 && storeCheck.rows[0].owner_id !== payload.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (store_name !== undefined) {
      updates.push(`store_name = $${paramCount++}`);
      values.push(store_name);
    }
    if (city !== undefined) {
      updates.push(`city = $${paramCount++}`);
      values.push(city);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true });
    }

    values.push(id);
    
    await query(
      `UPDATE stores SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update store error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
