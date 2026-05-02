import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { hashPassword, getSession, requireRole } from '@/lib/auth';
import { canAddStaff, normalizeTier } from '@/lib/tier-config';

function generatePassword(length = 8) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let retVal = '';
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const session = auth.user;

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const roleFilter = role ? `AND u.role = $2` : '';
    const params = [session.store_id];
    if (role) params.push(role);

    const res = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at, s.store_name
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
      WHERE u.store_id = $1 AND u.role != 'owner' ${roleFilter}
      ORDER BY u.created_at DESC
    `, params);

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

    const checkRes = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (checkRes.rows.length > 0) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    // --- Subscription Tier Enforcement ---
    const storeRes = await query(`SELECT subscription_tier FROM stores WHERE id = $1`, [session.store_id]);
    const tier = normalizeTier(storeRes.rows[0]?.subscription_tier);
    
    const staffCountRes = await query(`SELECT count(*) FROM users WHERE store_id = $1`, [session.store_id]);
    const currentStaffCount = parseInt(staffCountRes.rows[0].count, 10);

    const check = canAddStaff(tier, currentStaffCount);
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 403 });
    }
    // --- End Tier Enforcement ---
    
    // Auto-generate a 4-digit PIN if one is not provided
    const plainPin = pin || String(Math.floor(1000 + Math.random() * 9000));
    const pinHash = await hashPassword(plainPin);

    const tempPassword = generatePassword();
    const hashedPassword = await hashPassword(tempPassword);

    const authIdRes = await query('SELECT gen_random_uuid() as id');
    const authId = authIdRes.rows[0].id;

    await query(`
      INSERT INTO auth.users (
        instance_id, id, encrypted_password, email_confirmed_at, 
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, 
        aud, role
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', $1::uuid, crypt($2::text, gen_salt('bf')), NOW(),
        NOW(), NOW(), '{"provider":"email","providers":["email"]}', 
        format('{"sub":"%s","email":"%s"}', $1::text, $3::text)::jsonb, false,
        'authenticated', 'authenticated'
      )
    `, [authId, tempPassword, email]);
    
    await query(`
      INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::uuid, format('{"sub":"%s","email":"%s"}', $1::text, $2::text)::jsonb, 'email', $1::text, NOW(), NOW(), NOW()
      )
    `, [authId, email]);

    const res = await query(
      `INSERT INTO users (name, email, phone, password_hash, pin_hash, role, store_id, auth_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, phone, role, created_at`,
      [name, email, phone || '', hashedPassword, pinHash, role || 'staff', session.store_id, authId]
    );

    return NextResponse.json({ ...res.rows[0], pin: plainPin }, { status: 201 });
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
    const { id, name, email, phone, role, regeneratePin } = body;

    let pinHash = undefined;
    let plainPin = undefined;

    if (regeneratePin) {
      plainPin = String(Math.floor(1000 + Math.random() * 9000));
      pinHash = await hashPassword(plainPin);
    }

    const res = await query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email), 
           phone = COALESCE($3, phone), 
           role = COALESCE($4, role),
           pin_hash = COALESCE($5, pin_hash)
       WHERE id = $6 AND store_id = $7 AND role != 'owner'
       RETURNING id, name, email, phone, role, created_at`,
      [name, email, phone, role, pinHash, id, session.store_id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Staff not found or access denied' }, { status: 404 });
    }

    const response = { ...res.rows[0] };
    if (plainPin) response.pin = plainPin;

    return NextResponse.json(response);
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
