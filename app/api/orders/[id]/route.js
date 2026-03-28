import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const orderRes = await query(
      `SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderRes.rows[0];

    const itemsRes = await query(
      `SELECT oi.*, 
        (SELECT STRING_AGG(gw.stage || ':' || gw.timestamp, '|' ORDER BY gw.timestamp) 
         FROM garment_workflow gw WHERE gw.order_item_id = oi.id) as workflow_history
       FROM order_items oi WHERE oi.order_id = $1`,
      [id]
    );

    const paymentsRes = await query('SELECT * FROM payments WHERE order_id = $1', [id]);

    return NextResponse.json({ ...order, items: itemsRes.rows, payments: paymentsRes.rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const client = await getClient();
  try {
    const body = await request.json();
    const { items, discount, notes, schedule } = body;
    const safeNotes = sanitizeText(notes) || '';

    await client.query('BEGIN');

    // 1. Verify order exists and is in editable state
    const currentOrder = await client.query('SELECT status, total_amount, customer_id FROM orders WHERE id = $1', [id]);
    if (currentOrder.rows.length === 0) throw new Error('Order not found');
    if (currentOrder.rows[0].status !== 'received') throw new Error('Only received orders can be edited');

    const oldTotal = parseFloat(currentOrder.rows[0].total_amount);
    const customer_id = currentOrder.rows[0].customer_id;

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
      `UPDATE orders SET total_amount = $1, discount = $2, tax = $3, notes = $4, pickup_date = $5, delivery_date = $6
       WHERE id = $7`,
      [totalAmount, discountAmount, tax, safeNotes, pickupDate, deliveryDate, id]
    );

    // 4. Update items: simplest is to delete and re-insert for MVP
    await client.query('DELETE FROM garment_workflow WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = $1)', [id]);
    await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);

    for (const item of items) {
      const itemRes = await client.query(
        `INSERT INTO order_items (order_id, garment_type, service_type, quantity, price, status)
         VALUES ($1, $2, $3, $4, $5, 'received') RETURNING id`,
        [id, item.garment_type, item.service_type, item.quantity || 1, item.price]
      );
      await client.query(
        `INSERT INTO garment_workflow (order_item_id, stage, updated_by) VALUES ($1, 'received', 1)`,
        [itemRes.rows[0].id]
      );
    }

    // 5. Adjust Loyalty Points (subtract old, add new)
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
