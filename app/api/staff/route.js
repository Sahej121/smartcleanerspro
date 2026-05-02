import { query, transaction } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { hashPassword, getSession, requireRole } from '@/lib/auth';
import { canAddStaff, normalizeTier } from '@/lib/tier-config';
import { sendEmail } from '@/lib/email';

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
    const authReq = await requireRole(request, ['owner', 'manager']);
    if (authReq.error) return NextResponse.json({ error: authReq.error }, { status: authReq.status });
    const session = authReq.user;

    const body = await request.json();
    const { name, email, phone, role, pin } = body;

    // 1. Initial Validation
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const checkRes = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (checkRes.rows.length > 0) {
      return NextResponse.json({ error: 'A user with this email already exists in our records' }, { status: 400 });
    }

    // 2. Subscription Tier Enforcement
    const storeRes = await query(`SELECT subscription_tier FROM stores WHERE id = $1`, [session.store_id]);
    const tier = normalizeTier(storeRes.rows[0]?.subscription_tier);
    
    const staffCountRes = await query(`SELECT count(*) FROM users WHERE store_id = $1`, [session.store_id]);
    const currentStaffCount = parseInt(staffCountRes.rows[0].count, 10);

    const check = canAddStaff(tier, currentStaffCount);
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 403 });
    }

    // 3. Security Credentials Generation
    const plainPin = pin || String(Math.floor(1000 + Math.random() * 9000));
    const pinHash = await hashPassword(plainPin);
    const tempPassword = generatePassword();
    const hashedPassword = await hashPassword(tempPassword);

    // 4. Atomic Provisioning
    const result = await transaction(async (q) => {
      // A. Check if user exists in Supabase Auth already
      let authId;
      const existingAuth = await q(`SELECT id FROM auth.users WHERE email = $1`, [email]);
      
      if (existingAuth.rows.length > 0) {
        authId = existingAuth.rows[0].id;
        // User exists in auth but not in our public.users - this is common if they were partially deleted
        console.log(`[Staff API] Linking existing Auth user ${authId} for email ${email}`);
      } else {
        // Create new Auth User
        const authIdRes = await q('SELECT gen_random_uuid() as id');
        authId = authIdRes.rows[0].id;

        await q(`
          INSERT INTO auth.users (
            instance_id, id, encrypted_password, email_confirmed_at, 
            created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, 
            aud, role, email
          ) VALUES (
            '00000000-0000-0000-0000-000000000000', $1::uuid, crypt($2::text, gen_salt('bf')), NOW(),
            NOW(), NOW(), '{"provider":"email","providers":["email"]}', 
            format('{"sub":"%s","email":"%s"}', $1::text, $3::text)::jsonb, false,
            'authenticated', 'authenticated', $3
          )
        `, [authId, tempPassword, email]);
      }

      // B. Ensure Identity exists (Supabase requires this for email login)
      const existingIdentity = await q(`SELECT id FROM auth.identities WHERE user_id = $1`, [authId]);
      if (existingIdentity.rows.length === 0) {
        await q(`
          INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1::uuid, format('{"sub":"%s","email":"%s"}', $1::text, $2::text)::jsonb, 'email', $1::text, NOW(), NOW(), NOW()
          )
        `, [authId, email]);
      }

      // C. Insert into our public users table
      const res = await q(
        `INSERT INTO users (name, email, phone, password_hash, pin_hash, role, store_id, auth_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, name, email, phone, role, created_at`,
        [name, email, phone || '', hashedPassword, pinHash, role || 'staff', session.store_id, authId]
      );
      
      return res.rows[0];
    });

    // 5. Notification (Resend)
    try {
      await sendEmail({
        to: email,
        subject: `Welcome to the Team! Your Staff Access Details`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #10b981;">Welcome to the Team, ${name}!</h2>
            <p>You have been added as a <strong>${role || 'Staff Member'}</strong> at <strong>${session.store_name || 'the Store'}</strong>.</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Your Security PIN</p>
              <h1 style="margin: 10px 0; font-size: 48px; letter-spacing: 10px; color: #111;">${plainPin}</h1>
            </div>
            <p>Please keep this PIN secure. You will use it to clock in and process orders.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999; text-align: center;">This is an automated security message from your Dry Cleaners POS system.</p>
          </div>
        `,
        text: `Welcome ${name}! Your security PIN for ${session.store_name || 'the Store'} is: ${plainPin}`
      });
    } catch (emailErr) {
      console.error('[Staff API] Email delivery failed:', emailErr.message);
      // We don't fail the whole request if email fails, but we log it
    }

    return NextResponse.json({ ...result, pin: plainPin }, { status: 201 });
  } catch (error) {
    console.error('[Staff API Error]', error);
    return NextResponse.json({ error: error.message || 'Failed to provision staff' }, { status: 500 });
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
      [
        name ?? null, 
        email ?? null, 
        phone ?? null, 
        role ?? null, 
        pinHash ?? null, 
        id, 
        session.store_id
      ]
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
