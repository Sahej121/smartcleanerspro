import { getDb } from '@/lib/db/db';
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
    const db = getDb();
    const staff = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at, s.store_name
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
      WHERE u.role != 'owner'
      ORDER BY u.created_at DESC
    `).all();
    return NextResponse.json(staff);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, email, phone, role } = body;

    // Generate and hash password
    const tempPassword = generatePassword();
    const hashedPassword = await hashPassword(tempPassword);

    const result = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, store_id) VALUES (?, ?, ?, ?, ?, 1)
    `).run(name, email, phone || '', hashedPassword, role || 'staff');

    const user = db.prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    
    // Return user with the unhashed tempPassword so the UI can display it once
    return NextResponse.json({ ...user, tempPassword }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
