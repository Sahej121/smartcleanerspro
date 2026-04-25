import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { sanitizeText } from '@/lib/sanitize';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let sql = `
      SELECT 
        c.*, 
        COUNT(o.id) as order_count,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.store_id = $1
    `;
    const params = [auth.user.store_id];

    if (search) {
      sql += ' AND (c.name ILIKE $2 OR c.phone ILIKE $3 OR c.email ILIKE $4)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' GROUP BY c.id ORDER BY c.created_at DESC';

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
      `INSERT INTO customers (name, phone, email, address, notes, store_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [safeName, phone || '', email || '', safeAddress, safeNotes, auth.user.store_id]
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
