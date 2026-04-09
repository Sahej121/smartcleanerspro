import { query } from './lib/db/db.js';

async function migrateTiers() {
  console.log('--- Starting Tier Migration ---');
  
  try {
    // 1. Update starter -> software_only
    const res1 = await query("UPDATE stores SET subscription_tier = 'software_only' WHERE subscription_tier = 'starter'");
    console.log(`Migrated ${res1.rowCount} starter stores to software_only.`);

    // 2. Update growth -> hardware_bundle
    const res2 = await query("UPDATE stores SET subscription_tier = 'hardware_bundle' WHERE subscription_tier = 'growth'");
    console.log(`Migrated ${res2.rowCount} growth stores to hardware_bundle.`);

    // 3. Update pro -> hardware_bundle
    const res3 = await query("UPDATE stores SET subscription_tier = 'hardware_bundle' WHERE subscription_tier = 'pro'");
    console.log(`Migrated ${res3.rowCount} pro stores to hardware_bundle.`);

    console.log('--- Migration Complete ---');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateTiers();
