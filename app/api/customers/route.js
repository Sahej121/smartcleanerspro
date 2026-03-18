import { getDb } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as order_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = c.id AND payment_status = 'paid') as total_spent
      FROM customers c
    `;
    const params = [];

    if (search) {
      query += ' WHERE c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY c.created_at DESC';

    const customers = db.prepare(query).all(...params);
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, phone, email, address, notes } = body;

    const result = db.prepare(`
      INSERT INTO customers (name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?)
    `).run(name, phone || '', email || '', address || '', notes || '');

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
