import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { verifyToken, hashPassword } from '@/lib/auth';
import { cookies } from 'next/headers';

function generatePassword(length = 8) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let retVal = '';
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
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
    const { store_name, city, admin_name, admin_email, admin_phone } = body;

    if (!store_name || !city || !admin_name || !admin_email) {
      return NextResponse.json({ error: 'Missing required configuration fields.' }, { status: 400 });
    }

    // Generate and hash password for the new tenant admin
    const tempPassword = generatePassword();
    const hashedPassword = await hashPassword(tempPassword);

    const db = getDb();
    
    // Execute tenant creation inside a transaction
    const createTenant = db.transaction(() => {
      // 1. Create the store
      const storeInsert = db.prepare(`
        INSERT INTO stores (store_name, city, owner_id, status, subscription_status, last_activity) 
        VALUES (?, ?, ?, 'active', 'trial', CURRENT_TIMESTAMP)
      `).run(store_name, city, payload.id);
      
      const newStoreId = storeInsert.lastInsertRowid;

      // 2. Create the Admin/Manager user for this store
      db.prepare(`
        INSERT INTO users (name, email, phone, password_hash, role, store_id) VALUES (?, ?, ?, ?, ?, ?)
      `).run(admin_name, admin_email, admin_phone || '', hashedPassword, 'manager', newStoreId);

      // 3. Populate default pricing templates for the new store
      const insertPricing = db.prepare(`INSERT INTO pricing (garment_type, service_type, price, store_id) VALUES (?, ?, ?, ?)`);
      defaultPricing.forEach(p => insertPricing.run(p[0], p[1], p[2], newStoreId));

      // 4. Populate default inventory templates for the new store
      const insertInventory = db.prepare(`INSERT INTO inventory (item_name, quantity, unit, reorder_level, store_id) VALUES (?, ?, ?, ?, ?)`);
      defaultInventory.forEach(inv => insertInventory.run(inv[0], inv[1], inv[2], inv[3], newStoreId));

      return { store_id: newStoreId };
    });

    const result = createTenant();

    return NextResponse.json({
      success: true,
      store_id: result.store_id,
      store_name,
      admin_email,
      tempPassword
    }, { status: 201 });

  } catch (error) {
    console.error('API Error:', error);
    if (error.message.includes('UNIQUE constraint failed: users.email')) {
      return NextResponse.json({ error: 'That email is already registered.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
