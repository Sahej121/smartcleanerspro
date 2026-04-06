import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { hashPassword, getSession, requireRole } from '@/lib/auth';
import { canAddStaff } from '@/lib/tier-config';

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
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const res = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at, s.store_name
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
      WHERE u.store_id = $1 AND u.role != 'owner'
      ORDER BY u.created_at DESC
    `, [session.store_id]);

    return NextResponse.json(res.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const session = auth.user;

    const body = await request.json();
    const { name, email, phone, role, pin } = body;

    // --- Subscription Tier Enforcement ---
    const storeRes = await query(`SELECT subscription_tier FROM stores WHERE id = $1`, [session.store_id]);
    const tier = storeRes.rows[0]?.subscription_tier || 'starter';
    
    const staffCountRes = await query(`SELECT count(*) FROM users WHERE store_id = $1`, [session.store_id]);
    const currentStaffCount = parseInt(staffCountRes.rows[0].count, 10);

    const check = canAddStaff(tier, currentStaffCount);
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 403 });
    }
    // --- End Tier Enforcement ---
    
    let pinHash = null;
    if (pin) pinHash = await hashPassword(pin);

    const tempPassword = generatePassword();
    const hashedPassword = await hashPassword(tempPassword);

    const res = await query(
      `INSERT INTO users (name, email, phone, password_hash, pin_hash, role, store_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, phone, role, created_at`,
      [name, email, phone || '', hashedPassword, pinHash, role || 'staff', session.store_id]
    );

    return NextResponse.json({ ...res.rows[0], pin }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const session = auth.user;

    const body = await request.json();
    const { id, name, email, phone, role } = body;

    const res = await query(
      `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), 
       phone = COALESCE($3, phone), role = COALESCE($4, role)
       WHERE id = $5 AND store_id = $6 AND role != 'owner'
       RETURNING id, name, email, phone, role, created_at`,
      [name, email, phone, role, id, session.store_id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Staff not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const session = auth.user;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Staff ID required' }, { status: 400 });

    const res = await query(
      `DELETE FROM users WHERE id = $1 AND store_id = $2 AND role != 'owner' RETURNING id`,
      [id, session.store_id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Staff not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
