import { query, getClient } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

const sanitizeText = (text) => text?.replace(/[<>]/g, '') || '';

export async function GET(request, { params }) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await params;

    const orderRes = await query(
      `SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.id = $1 AND o.store_id = $2`,
      [id, auth.user.store_id]
    );

    if (orderRes.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderRes.rows[0];

    // Optimized items query with workflow pre-aggregation
    const [itemsRes, paymentsRes] = await Promise.all([
      query(
        `SELECT oi.*, 
          (SELECT STRING_AGG(gw.stage || ':' || gw.timestamp, '|' ORDER BY gw.timestamp) 
           FROM garment_workflow gw WHERE gw.order_item_id = oi.id) as workflow_history
         FROM order_items oi WHERE oi.order_id = $1`,
        [id]
      ),
      query('SELECT * FROM payments WHERE order_id = $1', [id])
    ]);

    return NextResponse.json({ ...order, items: itemsRes.rows, payments: paymentsRes.rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const client = await getClient();
  try {
    const body = await request.json();
    const { items, discount, notes, schedule, pickup_status, delivery_status, logistics_notes } = body;
    const safeNotes = sanitizeText(notes);

    await client.query('BEGIN');

    // 1. Verify order exists and is in editable state
    const currentOrder = await client.query('SELECT status, total_amount, customer_id, store_id, order_number FROM orders WHERE id = $1 AND store_id = $2', [id, auth.user.store_id]);
    if (currentOrder.rows.length === 0) throw new Error('Order not found');
    if (currentOrder.rows[0].status !== 'received') throw new Error('Only received orders can be edited');

    const oldTotal = parseFloat(currentOrder.rows[0].total_amount);
    const { customer_id, order_number } = currentOrder.rows[0];

    // 2. Recalculate Totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * (item.quantity || 1);
    }
    const discountAmount = discount || 0;
    const tax = Math.round((subtotal - discountAmount) * 0.18 * 100) / 100;
    const totalAmount = subtotal - discountAmount + tax;

    // 3. Update Order Fields
    let pickupDate = null;
    let deliveryDate = null;
    if (schedule) {
      if (schedule.pickupDate) pickupDate = schedule.pickupTime ? `${schedule.pickupDate} ${schedule.pickupTime}` : schedule.pickupDate;
      if (schedule.deliveryDate) deliveryDate = schedule.deliveryTime ? `${schedule.deliveryDate} ${schedule.deliveryTime}` : schedule.deliveryDate;
    }

    await client.query(
      `UPDATE orders SET total_amount = $1, discount = $2, tax = $3, notes = $4, pickup_date = $5, delivery_date = $6, pickup_status = $7, delivery_status = $8, logistics_notes = $9
       WHERE id = $10 AND store_id = $11`,
      [totalAmount, discountAmount, tax, safeNotes, pickupDate, deliveryDate, pickup_status || 'pending', delivery_status || 'pending', logistics_notes || null, id, auth.user.store_id]
    );

    // 4. Update items: Delete and Batch Re-insert
    await client.query('DELETE FROM garment_workflow WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = $1)', [id]);
    await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);

    if (items.length > 0) {
      const itemValues = [];
      const itemParams = [];
      let pIdx = 1;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const tagId = item.tag_id || `${order_number}-${i + 1}`;
        itemValues.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, 'received', $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        itemParams.push(id, item.garment_type, item.service_type, item.quantity || 1, item.price, item.notes || null, tagId, item.bag_id || null, item.incident_status || 'none', item.incident_notes || null);
      }

      const insertedItems = await client.query(
        `INSERT INTO order_items (order_id, garment_type, service_type, quantity, price, status, notes, tag_id, bag_id, incident_status, incident_notes)
         VALUES ${itemValues.join(', ')} RETURNING id`,
        itemParams
      );

      // Batch insert workflow records
      const workflowValues = insertedItems.rows.map((row, idx) => `($${idx * 3 + 1}, $${idx * 3 + 2}, $${idx * 3 + 3})`).join(', ');
      const workflowParams = insertedItems.rows.flatMap(row => [row.id, 'received', auth.user.id]);
      
      await client.query(
        `INSERT INTO garment_workflow (order_item_id, stage, updated_by) VALUES ${workflowValues}`,
        workflowParams
      );
    }

    // 5. Adjust Loyalty Points
    if (customer_id) {
      const oldPoints = Math.floor(oldTotal / 10);
      const newPoints = Math.floor(totalAmount / 10);
      await client.query(`UPDATE customers SET loyalty_points = loyalty_points - $1 + $2 WHERE id = $3`, [oldPoints, newPoints, customer_id]);
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true, total: totalAmount });
  } catch (error) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

