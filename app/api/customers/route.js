import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { sanitizeText } from '@/lib/sanitize';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let sql = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as order_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = c.id AND payment_status = 'paid') as total_spent
      FROM customers c
    `;
    const params = [];

    if (search) {
      sql += ' WHERE c.name ILIKE $1 OR c.phone ILIKE $2 OR c.email ILIKE $3';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY c.created_at DESC';

    const res = await query(sql, params);
    return NextResponse.json(res.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { name, phone, email, address, notes } = body;

    const safeName = sanitizeText(name) || '';
    const safeAddress = sanitizeText(address) || '';
    const safeNotes = sanitizeText(notes) || '';

    const res = await query(
      `INSERT INTO customers (name, phone, email, address, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [safeName, phone || '', email || '', safeAddress, safeNotes]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error) {
    if (error.code === '23505') {
      return NextResponse.json({ 
        error: 'A customer with this phone number already exists.',
        code: 'DUPLICATE_PHONE'
      }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
