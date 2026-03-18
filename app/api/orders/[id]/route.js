import { getDb } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const db = getDb();
    const { id } = await params;

    const order = db.prepare(`
      SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const items = db.prepare(`
      SELECT oi.*, 
        (SELECT GROUP_CONCAT(gw.stage || ':' || gw.timestamp, '|') 
         FROM garment_workflow gw WHERE gw.order_item_id = oi.id ORDER BY gw.timestamp) as workflow_history
      FROM order_items oi WHERE oi.order_id = ?
    `).all(id);

    const payments = db.prepare(`SELECT * FROM payments WHERE order_id = ?`).all(id);

    return NextResponse.json({ ...order, items, payments });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
