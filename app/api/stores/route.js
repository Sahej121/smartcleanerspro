import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db/db';
import { verifyToken, hashPassword } from '@/lib/auth';
import { cookies } from 'next/headers';
import { canCreateStore } from '@/lib/tier-config';

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
    const { store_name, city, admin_name, admin_email, admin_phone, subscription_tier } = body;

    // --- Tier Limit Enforcement ---
    const bypassTierCheck = payload.id === 1;

    if (!bypassTierCheck) {
      const ownerStoreRes = await query(
        `SELECT s.subscription_tier, (SELECT count(*) FROM stores WHERE owner_id = $1) as store_count FROM stores s WHERE s.owner_id = $1 LIMIT 1`,
        [payload.id]
      );
      const ownerTier = ownerStoreRes.rows[0]?.subscription_tier || 'software_only';
      const currentStoreCount = parseInt(ownerStoreRes.rows[0]?.store_count || '0', 10);

      const check = canCreateStore(ownerTier, currentStoreCount);
      if (!check.allowed) {
        return NextResponse.json({ error: check.reason }, { status: 403 });
      }
    }
    // --- End Tier Limit Enforcement ---

    if (!store_name || !city || !admin_name || !admin_email) {
      return NextResponse.json({ error: 'Missing required configuration fields.' }, { status: 400 });
    }

    // Generate and hash credentials for the new tenant admin
    const tempPassword = generatePassword();
    const tempPin = generatePin();
    
    const hashedPassword = await hashPassword(tempPassword);
    const hashedPin = await hashPassword(tempPin);

    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // 1. Create the store
      const storeRes = await client.query(
        `INSERT INTO stores (store_name, city, owner_id, status, subscription_tier, subscription_status, last_activity) 
         VALUES ($1, $2, $3, 'active', $4, 'trial', NOW()) RETURNING id`,
        [store_name, city, payload.id, subscription_tier || 'software_only']
      );
      const newStoreId = storeRes.rows[0].id;

      // 2. Create the Admin/Manager user for this store
      await client.query(
        `INSERT INTO users (name, email, phone, password_hash, pin_hash, role, store_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [admin_name, admin_email, admin_phone || '', hashedPassword, hashedPin, 'manager', newStoreId]
      );

      // 3. Populate default pricing templates for the new store
      for (const p of defaultPricing) {
        await client.query(
          `INSERT INTO pricing (garment_type, service_type, price, store_id) VALUES ($1, $2, $3, $4)`,
          [p[0], p[1], p[2], newStoreId]
        );
      }

      // 4. Populate default inventory templates for the new store
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
        tempPassword,
        tempPin
      }, { status: 201 });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('API Error:', error);
    if (error.message && error.message.includes('unique constraint')) {
      return NextResponse.json({ error: 'That email is already registered.' }, { status: 400 });
    }
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('cleanflow_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);

    // Owners and managers can list stores
    if (!payload || (payload.role !== 'owner' && payload.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isSaasOwner = payload.id === 1;

    let queryStr;
    let queryParams;

    if (payload.role === 'manager') {
      // Manager only sees their own store
      queryStr = `
        SELECT s.*,
               (SELECT count(*) FROM orders WHERE store_id = s.id) as order_count,
               (SELECT COALESCE(sum(total_amount), 0) FROM orders WHERE store_id = s.id AND payment_status = 'paid') as total_revenue
        FROM stores s
        WHERE s.id = $1
        ORDER BY s.created_at DESC
      `;
      queryParams = [payload.store_id];
    } else {
      // Owner sees all their stores (or overall if SaaS root)
      queryStr = `
        SELECT s.*,
               (SELECT count(*) FROM orders WHERE store_id = s.id) as order_count,
               (SELECT COALESCE(sum(total_amount), 0) FROM orders WHERE store_id = s.id AND payment_status = 'paid') as total_revenue
        FROM stores s
        WHERE ($1::boolean = TRUE) OR (s.owner_id = $2)
        ORDER BY s.created_at DESC
      `;
      queryParams = [isSaasOwner, payload.id];
    }

    const res = await query(queryStr, queryParams);

    return NextResponse.json(res.rows);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
