/**
 * Reset all users and seed superadmin sehajbudhiraja2000@gmail.com
 * 
 * Usage: node --env-file=.env.local scripts/reset-and-seed.mjs
 */

import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

const NEW_EMAIL = 'sehajbudhiraja2000@gmail.com';
const PASSWORD = 'Truewords10@';
const ADMIN_NAME = 'Sahej (Owner)';

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('🚀 Starting Reset and Seed process...');

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Clear all users (CASCADE deletes dependent records)
  console.log('\n🧹 Clearing all users from database...');
  await pool.query('TRUNCATE users RESTART IDENTITY CASCADE');
  console.log('   ✅ All users cleared.');

  // 2. Update role constraint to allow 'superadmin'
  console.log('\n🛠️ Updating role constraint...');
  try {
    // Drop existing check constraint (it might have different names depending on PG version/creation)
    // We try to find the constraint name first
    const constraintRes = await pool.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'users'::regclass AND contype = 'c' AND conname LIKE '%role%'
    `);
    
    for (const row of constraintRes.rows) {
      await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS ${row.conname}`);
    }
    
    await pool.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN ('superadmin', 'owner', 'manager', 'frontdesk', 'staff', 'driver'))
    `);
    console.log('   ✅ Role constraint updated.');
  } catch (err) {
    console.warn('   ⚠️ Failed to update constraint (might already be updated):', err.message);
  }

  // 3. Create/Ensure Supabase Auth user
  console.log('\n📦 Ensuring auth user exists...');
  let authUserId;
  
  const { data, error } = await supabase.auth.signUp({
    email: NEW_EMAIL,
    password: PASSWORD,
    options: {
      data: { name: ADMIN_NAME, role: 'superadmin' }
    }
  });

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      console.log('   User already exists in Auth, signing in to get UUID...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: NEW_EMAIL,
        password: PASSWORD,
      });
      if (signInError) {
        console.error('   ❌ Sign-in failed:', signInError.message);
        // If sign-in fails (e.g. wrong password), we might need to reset it via admin API if available
        // But for now we assume we have the right password or it was just created.
        process.exit(1);
      }
      authUserId = signInData.user.id;
    } else {
      console.error('   ❌ Signup error:', error.message);
      process.exit(1);
    }
  } else {
    authUserId = data.user.id;
  }
  console.log('   ✅ Auth user ID:', authUserId);

  // 4. Insert the SaaS owner into public.users
  console.log('\n👤 Seeding SaaS owner...');
  const pHash = await hashPassword(PASSWORD);
  const pinHash = await hashPassword('1234'); // Default PIN

  await pool.query(
    `INSERT INTO users (id, auth_id, name, email, role, password_hash, pin_hash, store_id) 
     VALUES (1, $1, $2, $3, 'superadmin', $4, $5, 1)`,
    [authUserId, ADMIN_NAME, NEW_EMAIL, pHash, pinHash]
  );
  console.log('   ✅ SaaS owner created with ID 1.');

  console.log('\n✨ Reset and Seed Complete!');
  console.log('   📧 Email:', NEW_EMAIL);
  console.log('   🔑 Password:', PASSWORD);
  console.log('   🔢 Default PIN: 1234');

  await pool.end();
  process.exit(0);
}

main().catch(err => { 
  console.error('\n❌ Fatal Error:', err); 
  process.exit(1); 
});
