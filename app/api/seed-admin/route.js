import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const email = 'sehajbudhiraja2000@gmail.com';
    const password = 'password123';
    const pin = '1234';
    
    // Check if user exists
    const res = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (res.rows.length > 0) {
      return NextResponse.json({ message: 'User already exists', password, pin });
    }

    const hashedPassword = await hashPassword(password);
    const hashedPin = await hashPassword(pin);

    await query(
      `INSERT INTO users (name, email, phone, password_hash, pin_hash, role) VALUES ($1, $2, $3, $4, $5, $6)`,
      ['Sahej (Superadmin)', email, '', hashedPassword, hashedPin, 'superadmin']
    );

    return NextResponse.json({ success: true, message: 'Superadmin created', email, password, pin });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
