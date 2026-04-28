/**
 * Update superadmin email to sehajbudhiraja2000@gmail.com
 * 
 * Usage: node --env-file=.env.local scripts/update-admin.mjs
 */

import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Pool } = pg;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

const NEW_EMAIL = 'sehajbudhiraja2000@gmail.com';
const PASSWORD = 'Truewords10@';
const ADMIN_NAME = 'Sahej (Owner)';

async function main() {
  console.log('🔄 Updating superadmin to', NEW_EMAIL);

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Create new Supabase Auth user
  console.log('\n📦 Creating new auth user...');
  let authUserId;
  
  const { data, error } = await supabase.auth.signUp({
    email: NEW_EMAIL,
    password: PASSWORD,
    options: {
      data: { name: ADMIN_NAME, role: 'owner' }
    }
  });

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      console.log('   User already exists, signing in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: NEW_EMAIL,
        password: PASSWORD,
      });
      if (signInError) {
        console.error('   ❌ Sign-in failed:', signInError.message);
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

  // 2. Update public.users — change email and auth_id for the owner
  console.log('\n📦 Updating public.users...');
  const existing = await pool.query("SELECT id FROM users WHERE role = 'owner' LIMIT 1");
  
  if (existing.rows.length > 0) {
    await pool.query(
      'UPDATE users SET email = $1, auth_id = $2 WHERE id = $3',
      [NEW_EMAIL, authUserId, existing.rows[0].id]
    );
    console.log('   ✅ Updated user ID', existing.rows[0].id, 'to', NEW_EMAIL);
  } else {
    await pool.query(
      'INSERT INTO users (auth_id, name, email, role, store_id) VALUES ($1, $2, $3, $4, 1)',
      [authUserId, ADMIN_NAME, NEW_EMAIL, 'owner']
    );
    console.log('   ✅ Created new owner user');
  }

  console.log('\n✅ Done! Login with:');
  console.log('   📧', NEW_EMAIL);
  console.log('   🔑 Truewords10@');

  await pool.end();
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
