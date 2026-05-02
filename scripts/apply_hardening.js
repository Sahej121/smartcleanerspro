const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

async function applyHardening() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('⏳ Connecting to database...');
    await client.connect();
    console.log('✅ Connected.');

    const sqlPath = path.resolve(__dirname, 'production_hardening.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('⏳ Applying hardening script...');
    
    // Split by semicolons but handle potential issues with triggers/functions
    // For simplicity, we'll run the whole block. 
    // If it fails, we'll try to report why.
    await client.query(sql);

    console.log('🚀 Hardening applied successfully!');
    console.log('Summary of changes:');
    console.log(' - Activity Logs table created and secured.');
    console.log(' - RLS enabled on orders, order_items, customers, inventory, and users.');
    console.log(' - Multi-tenant isolation policies applied.');
    console.log(' - Audit trigger for order deletions created.');

  } catch (err) {
    console.error('❌ Failed to apply hardening:');
    console.error(err.message);
    if (err.message.includes('already exists')) {
      console.log('💡 Note: Some objects already exist. This is normal if you\'ve run this script before.');
    }
  } finally {
    await client.end();
  }
}

applyHardening();
