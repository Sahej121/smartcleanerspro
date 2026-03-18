import { getDb } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
    `;
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('o.status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push('(o.order_number LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY o.created_at DESC';

    const orders = db.prepare(query).all(...params);
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { customer_id, items, payment_method, discount, notes } = body;

    // Generate order number
    const lastOrder = db.prepare('SELECT order_number FROM orders ORDER BY id DESC LIMIT 1').get();
    let nextNum = 1007;
    if (lastOrder) {
      const num = parseInt(lastOrder.order_number.replace('CF-', ''));
      nextNum = num + 1;
    }
    const orderNumber = `CF-${nextNum}`;

    // Calculate total
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * (item.quantity || 1);
    }
    const discountAmount = discount || 0;
    const tax = Math.round((subtotal - discountAmount) * 0.18 * 100) / 100;
    const totalAmount = subtotal - discountAmount + tax;

    // Insert order
    const orderResult = db.prepare(`
      INSERT INTO orders (order_number, customer_id, status, total_amount, discount, tax, payment_status, payment_method, notes)
      VALUES (?, ?, 'received', ?, ?, ?, ?, ?, ?)
    `).run(orderNumber, customer_id, totalAmount, discountAmount, tax, 
           payment_method ? 'paid' : 'pending', payment_method || 'cash', notes || '');

    const orderId = orderResult.lastInsertRowid;

    // Insert items
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, garment_type, service_type, quantity, price, status)
      VALUES (?, ?, ?, ?, ?, 'received')
    `);
    const insertWorkflow = db.prepare(`
      INSERT INTO garment_workflow (order_item_id, stage, updated_by)
      VALUES (?, 'received', 1)
    `);

    for (const item of items) {
      const itemResult = insertItem.run(orderId, item.garment_type, item.service_type, item.quantity || 1, item.price);
      insertWorkflow.run(itemResult.lastInsertRowid);
    }

    // Insert payment if paid
    if (payment_method) {
      db.prepare(`
        INSERT INTO payments (order_id, amount, payment_method, payment_status)
        VALUES (?, ?, ?, 'completed')
      `).run(orderId, totalAmount, payment_method);
    }

    // Update customer loyalty points
    if (customer_id) {
      db.prepare(`UPDATE customers SET loyalty_points = loyalty_points + ? WHERE id = ?`)
        .run(Math.floor(totalAmount / 10), customer_id);
    }

    const order = db.prepare(`
      SELECT o.*, c.name as customer_name 
      FROM orders o LEFT JOIN customers c ON o.customer_id = c.id 
      WHERE o.id = ?
    `).get(orderId);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
