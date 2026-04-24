/**
 * Supabase Initialization Script
 * 
 * This script:
 * 1. Runs the schema.sql on the Supabase PostgreSQL database
 * 2. Creates the superadmin user in Supabase Auth
 * 3. Creates the corresponding record in public.users linked via auth_id
 * 4. Seeds the default store and essential data
 * 
 * Usage: node --env-file=.env.local scripts/init-supabase.mjs
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const { Pool } = pg;

// --- Config ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // using anon key; service role key is better but this works for signUp
const DATABASE_URL = process.env.DATABASE_URL;

const ADMIN_EMAIL = 'sahej@cleanflow.com';
const ADMIN_PASSWORD = 'Truewords10@';
const ADMIN_NAME = 'Sahej (Owner)';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !DATABASE_URL) {
  console.error('❌ Missing environment variables. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and DATABASE_URL.');
  process.exit(1);
}

async function main() {
  console.log('🚀 Initializing Supabase for CleanFlow...\n');

  // --- 1. Connect to Supabase PostgreSQL ---
  console.log('📦 Step 1: Connecting to Supabase PostgreSQL...');
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const testRes = await pool.query('SELECT NOW()');
    console.log('   ✅ Connected! Server time:', testRes.rows[0].now);
  } catch (err) {
    console.error('   ❌ Failed to connect to database:', err.message);
    console.error('   💡 Check your DATABASE_URL in .env.local');
    process.exit(1);
  }

  // --- 2. Run Schema ---
  console.log('\n📦 Step 2: Running schema.sql...');
  try {
    const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);
    console.log('   ✅ Schema applied successfully!');
  } catch (err) {
    console.error('   ❌ Schema error:', err.message);
    // Continue — some errors are expected if tables already exist
  }

  // --- 3. Seed default store ---
  console.log('\n📦 Step 3: Seeding default store...');
  try {
    const storeCheck = await pool.query('SELECT COUNT(*) as count FROM stores');
    if (parseInt(storeCheck.rows[0].count) === 0) {
      await pool.query(
        `INSERT INTO stores (store_name, address, city, country, phone, subscription_tier, subscription_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['DrycleanersFlow Main', '123 MG Road', 'New Delhi', 'India', '+91-9876543210', 'enterprise', 'active']
      );
      console.log('   ✅ Default store created (enterprise tier)');
    } else {
      console.log('   ⏭️  Stores already exist, skipping');
    }
  } catch (err) {
    console.error('   ⚠️  Store seed warning:', err.message);
  }

  // --- 4. Create Supabase Auth user ---
  console.log('\n📦 Step 4: Creating superadmin in Supabase Auth...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let authUserId;
  try {
    // Try to sign up the user
    const { data, error } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      options: {
        data: {
          name: ADMIN_NAME,
          role: 'owner',
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        console.log('   ⏭️  Auth user already exists, attempting sign-in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });
        if (signInError) {
          console.error('   ❌ Cannot sign in existing user:', signInError.message);
          console.log('   💡 You may need to manually check the Supabase Auth dashboard');
          process.exit(1);
        }
        authUserId = signInData.user.id;
      } else {
        console.error('   ❌ Auth signup error:', error.message);
        process.exit(1);
      }
    } else {
      authUserId = data.user.id;
    }
    console.log('   ✅ Auth user ID:', authUserId);
  } catch (err) {
    console.error('   ❌ Auth error:', err.message);
    process.exit(1);
  }

  // --- 5. Create public.users record linked to auth ---
  console.log('\n📦 Step 5: Creating superadmin in public.users...');
  try {
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [ADMIN_EMAIL]);
    if (existingUser.rows.length > 0) {
      // Update existing user with auth_id
      await pool.query('UPDATE users SET auth_id = $1 WHERE email = $2', [authUserId, ADMIN_EMAIL]);
      console.log('   ✅ Existing user updated with auth_id');
    } else {
      await pool.query(
        `INSERT INTO users (auth_id, name, email, role, store_id) VALUES ($1, $2, $3, $4, 1)`,
        [authUserId, ADMIN_NAME, ADMIN_EMAIL, 'owner']
      );
      console.log('   ✅ Superadmin user created in public.users');
    }
  } catch (err) {
    console.error('   ❌ User insert error:', err.message);
  }

  // --- 6. Seed essential data ---
  console.log('\n📦 Step 6: Seeding essential data (pricing, inventory)...');
  try {
    const pricingCheck = await pool.query('SELECT COUNT(*) as count FROM pricing');
    if (parseInt(pricingCheck.rows[0].count) === 0) {
      const pricing = [
        ['Shirt', 'Dry Cleaning', 80], ['Shirt', 'Washing', 40], ['Shirt', 'Ironing', 25], ['Shirt', 'Stain Removal', 100],
        ['Suit', 'Dry Cleaning', 250], ['Suit', 'Washing', 150], ['Suit', 'Ironing', 80], ['Suit', 'Stain Removal', 200],
        ['Dress', 'Dry Cleaning', 200], ['Dress', 'Washing', 120], ['Dress', 'Ironing', 60], ['Dress', 'Stain Removal', 180],
        ['Coat', 'Dry Cleaning', 300], ['Coat', 'Washing', 200], ['Coat', 'Ironing', 100],
        ['Trousers', 'Dry Cleaning', 120], ['Trousers', 'Washing', 60], ['Trousers', 'Ironing', 35], ['Trousers', 'Stain Removal', 120],
        ['Curtains', 'Dry Cleaning', 350], ['Curtains', 'Washing', 250], ['Curtains', 'Ironing', 150],
        ['Blanket', 'Dry Cleaning', 400], ['Blanket', 'Washing', 300],
        ['Saree', 'Dry Cleaning', 200], ['Saree', 'Washing', 100], ['Saree', 'Ironing', 80], ['Saree', 'Stain Removal', 150],
        ['Jacket', 'Dry Cleaning', 220], ['Jacket', 'Washing', 140], ['Jacket', 'Ironing', 70],
        ['Shirt', 'Express Service', 150], ['Suit', 'Express Service', 450], ['Dress', 'Express Service', 380],
      ];
      for (const pr of pricing) {
        await pool.query(
          `INSERT INTO pricing (garment_type, service_type, price) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          pr
        );
      }
      console.log('   ✅ Pricing data seeded');
    } else {
      console.log('   ⏭️  Pricing data already exists, skipping');
    }

    const inventoryCheck = await pool.query('SELECT COUNT(*) as count FROM inventory');
    if (parseInt(inventoryCheck.rows[0].count) === 0) {
      const inventory = [
        ['Detergent (Liquid)', 25, 'liters', 5],
        ['Dry Cleaning Solvent', 15, 'liters', 5],
        ['Fabric Softener', 10, 'liters', 3],
        ['Stain Remover', 8, 'bottles', 2],
        ['Hangers (Plastic)', 200, 'units', 50],
        ['Garment Bags', 150, 'units', 30],
        ['Tags/Labels', 500, 'units', 100],
        ['Packaging Wrap', 20, 'rolls', 5],
      ];
      for (const inv of inventory) {
        await pool.query(
          `INSERT INTO inventory (item_name, quantity, unit, reorder_level) VALUES ($1, $2, $3, $4)`,
          inv
        );
      }
      console.log('   ✅ Inventory data seeded');
    } else {
      console.log('   ⏭️  Inventory data already exists, skipping');
    }

    // Volume discounts
    const volCheck = await pool.query('SELECT COUNT(*) as count FROM volume_discounts');
    if (parseInt(volCheck.rows[0].count) === 0) {
      await pool.query(
        'INSERT INTO volume_discounts (min_quantity, discount_percent, is_active) VALUES ($1, $2, $3)',
        [5, 10, true]
      );
      console.log('   ✅ Volume discounts seeded');
    }

  } catch (err) {
    console.error('   ⚠️  Seed warning:', err.message);
  }

  // --- Done ---
  console.log('\n✅ Supabase initialization complete!');
  console.log('   📧 Login: sahej@cleanflow.com');
  console.log('   🔑 Password: Truewords10@');
  console.log('\n   Run `npm run dev` to start the application.');

  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
