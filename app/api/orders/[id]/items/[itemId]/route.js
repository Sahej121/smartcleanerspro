import { query } from '@/lib/db/db';
const client = { query };
import { requireRole } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Update item tracking (tag, bag, incident, status)
export async function PATCH(req, { params }) {
  const auth = await requireRole(req, ['owner', 'manager', 'staff']);
  if (auth instanceof Response) return auth;

  const { id, itemId } = await params;
  const body = await req.json();
  const { tag_id, bag_id, incident_status, incident_notes, status } = body;

  try {
    const fields = [];
    const values = [];
    let i = 1;

    if (tag_id !== undefined) {
      fields.push(`tag_id = $${i++}`);
      values.push(tag_id);
    }
    if (bag_id !== undefined) {
      fields.push(`bag_id = $${i++}`);
      values.push(bag_id);
    }
    if (incident_status !== undefined) {
      fields.push(`incident_status = $${i++}`);
      values.push(incident_status);
    }
    if (incident_notes !== undefined) {
      fields.push(`incident_notes = $${i++}`);
      values.push(incident_notes);
    }
    if (status !== undefined) {
      fields.push(`status = $${i++}`);
      values.push(status);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(itemId);
    const query = `UPDATE order_items SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`;
    const res = await client.query(query, values);

    // Record in workflow if status or incident changed
    if (status || incident_status) {
      await client.query(
        `INSERT INTO garment_workflow (order_item_id, stage, notes, updated_by) VALUES ($1, $2, $3, $4)`,
        [itemId, status || 'incident_report', incident_notes || 'Status/Incident updated', auth.user.id]
      );
    }

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Tag ID already in use' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get item history
export async function GET(req, { params }) {
  const auth = await requireRole(req, ['owner', 'manager', 'staff']);
  if (auth instanceof Response) return auth;

  const { itemId } = await params;

  try {
    const itemRes = await client.query(
      `SELECT oi.*, 
        json_agg(gw.* ORDER BY gw.timestamp DESC) as history
       FROM order_items oi
       LEFT JOIN garment_workflow gw ON oi.id = gw.order_item_id
       WHERE oi.id = $1
       GROUP BY oi.id`,
      [itemId]
    );

    if (itemRes.rowCount === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(itemRes.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
