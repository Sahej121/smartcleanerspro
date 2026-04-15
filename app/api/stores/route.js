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
    const cookieStore = await cookies();
    const token = cookieStore.get('cleanflow_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);

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

      // 1. Handle Owner Creation (Superadmin only - for new business onboarding)
      if (isSuperadmin && !targetOwnerId) {
        if (!admin_email || !admin_name) {
          throw new Error('Owner details (name and email) required for new provisioning.');
        }

        // Check if user exists
        const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [admin_email]);
        if (userCheck.rows.length > 0) {
          targetOwnerId = userCheck.rows[0].id;
        } else {
          tempPassword = generatePassword();
          tempPin = generatePin();
          const pHash = await hashPassword(tempPassword);
          const pinHash = await hashPassword(tempPin);

          const userRes = await client.query(
            `INSERT INTO users (name, email, role, password_hash, pin_hash) VALUES ($1, $2, 'owner', $3, $4) RETURNING id`,
            [admin_name, admin_email, pHash, pinHash]
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
        const managerPassword = generatePassword();
        const managerPin = generatePin();
        const pHash = await hashPassword(managerPassword);
        const pinHash = await hashPassword(managerPin);

        await client.query(
          `INSERT INTO users (name, email, role, store_id, password_hash, pin_hash) VALUES ($1, $2, 'manager', $3, $4, $5)`,
          [manager_name, manager_email, newStoreId, pHash, pinHash]
        );
        managerDetails = {
          name: manager_name,
          email: manager_email,
          tempPin: managerPin,
          tempPassword: managerPassword
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
    const cookieStore = await cookies();
    const token = cookieStore.get('cleanflow_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);

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
