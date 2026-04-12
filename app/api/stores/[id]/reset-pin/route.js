import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { hashPassword, requireRole } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const auth = await requireRole(request, ['owner']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    
    const { id: storeId } = await params;
    
    // Validate storeId
    if (!storeId || isNaN(parseInt(storeId))) {
      return NextResponse.json({ error: 'Invalid store identification' }, { status: 400 });
    }

    // 1. Find the manager for this store
    const managerRes = await query(
      `SELECT id, name, email FROM users WHERE store_id = $1 AND role = 'manager' LIMIT 1`,
      [storeId]
    );

    if (managerRes.rows.length === 0) {
      return NextResponse.json({ error: 'No manager found for this store' }, { status: 404 });
    }

    const manager = managerRes.rows[0];

    // 2. Generate new random 4-digit PIN
    const plainPin = String(Math.floor(1000 + Math.random() * 9000));
    const hashedPin = await hashPassword(plainPin);

    // 3. Update the manager's PIN
    await query(
      `UPDATE users SET pin_hash = $1 WHERE id = $2`,
      [hashedPin, manager.id]
    );

    return NextResponse.json({
      success: true,
      manager_name: manager.name,
      manager_email: manager.email,
      new_pin: plainPin
    });

  } catch (error) {
    console.error('Error resetting manager PIN:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
