import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';

function generatePassword(length = 8) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let retVal = '';
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

export async function GET() {
  try {
    const res = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at, s.store_name
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
      WHERE u.role != 'owner'
      ORDER BY u.created_at DESC
    `);
    return NextResponse.json(res.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, role, pin } = body;
    
    let pinHash = null;
    if (pin) {
      pinHash = await hashPassword(pin);
    }

    // Generate a fallback random password for full-account access if ever needed
    const tempPassword = generatePassword();
    const hashedPassword = await hashPassword(tempPassword);

    const res = await query(
      `INSERT INTO users (name, email, phone, password_hash, pin_hash, role, store_id) VALUES ($1, $2, $3, $4, $5, $6, 1)
       RETURNING id, name, email, phone, role, created_at`,
      [name, email, phone || '', hashedPassword, pinHash, role || 'staff']
    );

    return NextResponse.json({ ...res.rows[0], pin }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, email, phone, role } = body;

    const res = await query(
      `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), 
       phone = COALESCE($3, phone), role = COALESCE($4, role)
       WHERE id = $5 RETURNING id, name, email, phone, role, created_at`,
      [name, email, phone, role, id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Staff ID required' }, { status: 400 });
    }

    const res = await query(
      `DELETE FROM users WHERE id = $1 AND role != 'owner' RETURNING id`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Staff not found or cannot delete owner' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
