import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db/db';
import { verifyToken, hashPassword } from '@/lib/auth';
import { cookies } from 'next/headers';
import { canCreateStore } from '@/lib/tier-config';
import { reconcileStoreLimits } from '@/lib/tier-enforcement';

function generatePassword(length = 8) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let retVal = '';
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

function generatePin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

const defaultPricing = [
  ['Shirt', 'Dry Cleaning', 80], ['Shirt', 'Washing', 40], ['Shirt', 'Ironing', 25], ['Shirt', 'Stain Removal', 100],
  ['Suit', 'Dry Cleaning', 250], ['Suit', 'Washing', 150], ['Suit', 'Ironing', 80], ['Suit', 'Stain Removal', 200],
  ['Dress', 'Dry Cleaning', 200], ['Dress', 'Washing', 120], ['Dress', 'Ironing', 60], ['Dress', 'Stain Removal', 180],
  ['Coat', 'Dry Cleaning', 300], ['Coat', 'Washing', 200], ['Coat', 'Ironing', 100],
  ['Trousers', 'Dry Cleaning', 120], ['Trousers', 'Washing', 60], ['Trousers', 'Ironing', 35], ['Trousers', 'Stain Removal', 120],
  ['Curtains', 'Dry Cleaning', 350], ['Curtains', 'Washing', 250], ['Curtains', 'Ironing', 150],
  ['Blanket', 'Dry Cleaning', 400], ['Blanket', 'Washing', 300],
  ['Saree', 'Dry Cleaning', 200], ['Saree', 'Washing', 100], ['Saree', 'Ironing', 80], ['Saree', 'Stain Removal', 150],
];

const defaultInventory = [
  ['Detergent (Liquid)', 25, 'liters', 5],
  ['Dry Cleaning Solvent', 15, 'liters', 5],
  ['Fabric Softener', 10, 'liters', 3],
  ['Stain Remover', 8, 'bottles', 2],
  ['Hangers (Plastic)', 200, 'units', 50],
  ['Garment Bags', 150, 'units', 30],
  ['Tags/Labels', 500, 'units', 100],
];

export async function POST(req) {
  try {
    const payload = await verifyToken();

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners can create new stores
    if (!payload || payload.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden. Owner access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { store_name, city, subscription_tier, admin_name, admin_email, owner_id, manager_name, manager_email } = body;

    const isSuperadmin = payload.id === 1;

    if (!store_name || !city) {
      return NextResponse.json({ error: 'Missing required configuration fields.' }, { status: 400 });
    }

    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      let targetOwnerId = owner_id;
      let tempPassword = null;
      let tempPin = null;
      let managerDetails = null;
      let mProvisionPassword = null;
      let mProvisionPin = null;

      // 1. Handle Owner Creation (Superadmin only - for new business onboarding)
      if (isSuperadmin && !targetOwnerId) {
        if (!admin_email || !admin_name) {
          throw new Error('Owner details (name and email) required for new provisioning.');
        }

        // Check if user exists in public.users
        const userCheck = await client.query('SELECT id, auth_id FROM users WHERE email = $1', [admin_email]);
        if (userCheck.rows.length > 0) {
          targetOwnerId = userCheck.rows[0].id;
        } else {
          // Check if user exists in auth.users
          const authCheck = await client.query('SELECT id FROM auth.users WHERE email = $1', [admin_email]);
          let authId;

          if (authCheck.rows.length > 0) {
            authId = authCheck.rows[0].id;
          } else {
            // Provision new auth user
            tempPassword = generatePassword();
            const authIdRes = await client.query('SELECT gen_random_uuid() as id');
            authId = authIdRes.rows[0].id;

            await client.query(`
              INSERT INTO auth.users (
                instance_id, id, email, encrypted_password, email_confirmed_at, 
                created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, 
                aud, role, confirmation_token, email_change, email_change_token_new, recovery_token
              ) VALUES (
                '00000000-0000-0000-0000-000000000000', $1::uuid, $2::text, crypt($3::text, gen_salt('bf')), NOW(),
                NOW(), NOW(), '{"provider":"email","providers":["email"]}', 
                format('{"sub":"%s","email":"%s"}', $1::text, $2::text)::jsonb, false,
                'authenticated', 'authenticated', '', '', '', ''
              )
            `, [authId, admin_email, tempPassword]);
            
            await client.query(`
              INSERT INTO auth.identities (
                id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at, email
              ) VALUES (
                gen_random_uuid(), $1::uuid, format('{"sub":"%s","email":"%s"}', $1::text, $2::text)::jsonb, 'email', $1::text, NOW(), NOW(), NOW(), $2
              )
            `, [authId, admin_email]);
          }

          // Create public user entry
          tempPin = generatePin();
          const pHash = await hashPassword(tempPassword || 'reused_account');
          const pinHash = await hashPassword(tempPin);

          const userRes = await client.query(
            `INSERT INTO users (name, email, role, password_hash, pin_hash, auth_id) VALUES ($1, $2, 'owner', $3, $4, $5) RETURNING id`,
            [admin_name, admin_email, pHash, pinHash, authId]
          );
          targetOwnerId = userRes.rows[0].id;
        }
      } else if (!isSuperadmin) {
        targetOwnerId = payload.id;
      }

      if (!targetOwnerId) {
        throw new Error('Target owner identification failed.');
      }

      // 2. Tier Limit Enforcement (Non-superadmin)
      if (!isSuperadmin) {
        const ownerStoreRes = await client.query(
          `SELECT s.subscription_tier, (SELECT count(*) FROM stores WHERE owner_id = $1) as store_count FROM stores s WHERE s.owner_id = $1 LIMIT 1`,
          [targetOwnerId]
        );
        const ownerTier = ownerStoreRes.rows[0]?.subscription_tier || 'software_only';
        const currentStoreCount = parseInt(ownerStoreRes.rows[0]?.store_count || '0', 10);

        const check = canCreateStore(ownerTier, currentStoreCount);
        if (!check.allowed) {
          throw new Error(check.reason);
        }
      }

      // 3. Create the store
      const storeRes = await client.query(
        `INSERT INTO stores (store_name, city, owner_id, status, subscription_tier, subscription_status, last_activity) 
         VALUES ($1, $2, $3, 'active', $4, 'trial', NOW()) RETURNING id`,
        [store_name, city, targetOwnerId, subscription_tier || 'software_only']
      );
      const newStoreId = storeRes.rows[0].id;

      // Update the user's primary store if they don't have one
      await client.query('UPDATE users SET store_id = $1 WHERE id = $2 AND store_id IS NULL', [newStoreId, targetOwnerId]);

      // 4. Handle Manager Provisioning (Optional)
      if (manager_email && manager_name) {
        mProvisionPassword = generatePassword();
        mProvisionPin = generatePin();

        // Check if manager exists in public.users
        const magUserCheck = await client.query('SELECT id, auth_id FROM users WHERE email = $1', [manager_email]);
        let magAuthId;
        
        if (magUserCheck.rows.length > 0) {
          magAuthId = magUserCheck.rows[0].auth_id;
          
          // Hash the new password and pin
          const pHash = await hashPassword(mProvisionPassword);
          const pinHash = await hashPassword(mProvisionPin);

          // Reuse public user but update their store, role, and credentials
          await client.query(
            `UPDATE users SET store_id = $1, role = 'manager', password_hash = $3, pin_hash = $4 WHERE id = $2`,
            [newStoreId, magUserCheck.rows[0].id, pHash, pinHash]
          );

          // Also reset Supabase Auth password for this existing user
          await client.query(
            `UPDATE auth.users SET encrypted_password = crypt($1::text, gen_salt('bf')), updated_at = NOW() WHERE id = $2`,
            [mProvisionPassword, magAuthId]
          );
        } else {
          // Check if manager exists in auth.users
          const authCheck = await client.query('SELECT id FROM auth.users WHERE email = $1', [manager_email]);
          if (authCheck.rows.length > 0) {
            magAuthId = authCheck.rows[0].id;
            // Force password update for existing account as per user request
            await client.query(
              `UPDATE auth.users SET encrypted_password = crypt($1::text, gen_salt('bf')), updated_at = NOW() WHERE id = $2`,
              [mProvisionPassword, magAuthId]
            );
          } else {
            // Provision new auth user
            mProvisionPassword = generatePassword();
            const magAuthIdRes = await client.query('SELECT gen_random_uuid() as id');
            magAuthId = magAuthIdRes.rows[0].id;

            await client.query(`
              INSERT INTO auth.users (
                instance_id, id, email, encrypted_password, email_confirmed_at, 
                created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, 
                aud, role, confirmation_token, email_change, email_change_token_new, recovery_token
              ) VALUES (
                '00000000-0000-0000-0000-000000000000', $1::uuid, $2::text, crypt($3::text, gen_salt('bf')), NOW(),
                NOW(), NOW(), '{"provider":"email","providers":["email"]}', 
                format('{"sub":"%s","email":"%s"}', $1::text, $2::text)::jsonb, false,
                'authenticated', 'authenticated', '', '', '', ''
              )
            `, [magAuthId, manager_email, mProvisionPassword]);
            
            await client.query(`
              INSERT INTO auth.identities (
                id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at, email
              ) VALUES (
                gen_random_uuid(), $1::uuid, format('{"sub":"%s","email":"%s"}', $1::text, $2::text)::jsonb, 'email', $1::text, NOW(), NOW(), NOW(), $2
              )
            `, [magAuthId, manager_email]);
          }

          // Create public user entry
          mProvisionPin = generatePin();
          const finalManagerPasswordHash = await hashPassword(mProvisionPassword || 'reused_account');
          const finalManagerPinHash = await hashPassword(mProvisionPin);

          await client.query(
            `INSERT INTO users (name, email, role, store_id, password_hash, pin_hash, auth_id) VALUES ($1, $2, 'manager', $3, $4, $5, $6)`,
            [manager_name, manager_email, newStoreId, finalManagerPasswordHash, finalManagerPinHash, magAuthId]
          );
        }

        managerDetails = {
          name: manager_name,
          email: manager_email,
          tempPin: mProvisionPin,
          tempPassword: mProvisionPassword
        };
      }

      // 5. Populate default pricing templates for the new store
      for (const p of defaultPricing) {
        await client.query(
          `INSERT INTO pricing (garment_type, service_type, price, store_id) VALUES ($1, $2, $3, $4)`,
          [p[0], p[1], p[2], newStoreId]
        );
      }

      // 6. Populate default inventory templates for the new store
      for (const inv of defaultInventory) {
        await client.query(
          `INSERT INTO inventory (item_name, quantity, unit, reorder_level, store_id) VALUES ($1, $2, $3, $4, $5)`,
          [inv[0], inv[1], inv[2], inv[3], newStoreId]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        store_id: newStoreId,
        store_name,
        owner_id: targetOwnerId,
        admin_email: admin_email || null,
        tempPassword,
        tempPin,
        manager: managerDetails
      }, { status: 201 });

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('API Error details:', err);
      return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 400 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Core API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const payload = await verifyToken();

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!payload || (payload.role !== 'owner' && payload.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isSaasOwner = payload.id === 1;
    const { searchParams } = new URL(request.url);
    const isHierarchical = searchParams.get('hierarchical') === 'true';

    if (isSaasOwner && isHierarchical) {
      // Superadmin sees all owners and their stores - ONLY for cluster management view
      const ownersRes = await query(`
        SELECT 
          u.id as owner_id, 
          u.name as name, 
          u.email as email, 
          u.phone as phone,
          u.created_at,
          (SELECT subscription_tier FROM stores WHERE owner_id = u.id ORDER BY created_at ASC LIMIT 1) as tier,
          (SELECT COUNT(*) FROM stores WHERE owner_id = u.id) as store_count,
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders o JOIN stores s ON o.store_id = s.id WHERE s.owner_id = u.id AND o.payment_status = 'paid') as total_revenue
        FROM users u
        WHERE u.role = 'owner' AND u.id != 1
        ORDER BY u.created_at DESC
      `);

      const storesRes = await query(`
        SELECT s.*, 
               (SELECT count(*) FROM orders WHERE store_id = s.id) as order_count,
               (SELECT COALESCE(sum(total_amount), 0) FROM orders WHERE store_id = s.id AND payment_status = 'paid') as total_revenue
        FROM stores s
        ORDER BY s.created_at DESC
      `);

      const owners = ownersRes.rows.map(owner => ({
        ...owner,
        stores: storesRes.rows.filter(s => s.owner_id === owner.owner_id)
      }));

      return NextResponse.json(owners);
    }
    
    // --- SELF-HEALING HOOK ---
    // If the user is an owner, ensure their fleet is consistent
    if (payload.role === 'owner') {
      try {
        const client = await getClient();
        try {
          // 1. Check for tier mismatch or missing NZ country data
          const checkRes = await client.query(`
            SELECT id, subscription_tier, store_name, country 
            FROM stores 
            WHERE owner_id = $1 
            ORDER BY created_at ASC`, 
            [payload.id]
          );
          
          if (checkRes.rows.length > 0) {
            const primaryTier = checkRes.rows[0].subscription_tier;
            const needsAlignment = checkRes.rows.some(s => s.subscription_tier !== primaryTier);
            const needsNZFix = checkRes.rows.some(s => 
              (s.store_name.toLowerCase().includes('auckland') || s.store_name.toLowerCase().replace(' ', '').includes('newzealand')) && 
              s.country !== 'New Zealand'
            );

            if (needsAlignment || needsNZFix) {
              await client.query('BEGIN');
              
              // Apply Tier Alignment
              if (needsAlignment) {
                await reconcileStoreLimits({ query: (text, params) => client.query(text, params) }, payload.id, primaryTier);
              }
              
              // Apply Regional Correction (NZ Fix)
              if (needsNZFix) {
                await client.query(`
                  UPDATE stores 
                  SET country = 'New Zealand' 
                  WHERE owner_id = $1 
                  AND (store_name ILIKE '%Auckland%' OR store_name ILIKE '%NewZealand%' OR store_name ILIKE '%New Zealand%')`,
                  [payload.id]
                );
              }
              
              await client.query('COMMIT');
            }
          }
        } finally {
          client.release();
        }
      } catch (err) {
        console.error('[Self-Healing] Failed to align fleet:', err);
      }
    }

    // Regular owners/managers see their own stores flat
    let queryStr;
    let queryParams;

    if (payload.role === 'manager') {
      queryStr = `
        SELECT s.*,
               (SELECT count(*) FROM orders WHERE store_id = s.id) as order_count,
               (SELECT COALESCE(sum(total_amount), 0) FROM orders WHERE store_id = s.id AND payment_status = 'paid') as total_revenue
        FROM stores s
        WHERE s.id = $1
      `;
      queryParams = [payload.store_id];
    } else {
      queryStr = `
        SELECT s.*,
               (SELECT count(*) FROM orders WHERE store_id = s.id) as order_count,
               (SELECT COALESCE(sum(total_amount), 0) FROM orders WHERE store_id = s.id AND payment_status = 'paid') as total_revenue
        FROM stores s
        WHERE s.owner_id = $1
        ORDER BY s.created_at ASC
      `;
      queryParams = [payload.id];
    }

    const res = await query(queryStr, queryParams);
    return NextResponse.json(res.rows);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
