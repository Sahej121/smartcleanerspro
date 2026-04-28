import { query } from './lib/db/db.js';

async function migrateTiers() {
  console.log('--- Starting Tier Migration ---');
  
  try {
    // 1. Update starter -> software_only
    const res1 = await query("UPDATE stores SET subscription_tier = 'software_only' WHERE subscription_tier = 'starter'");
    console.log(`Migrated ${res1.rowCount} starter stores to software_only.`);

    // 2. Update standard -> software_only
    const res2 = await query("UPDATE stores SET subscription_tier = 'software_only' WHERE subscription_tier = 'standard'");
    console.log(`Migrated ${res2.rowCount} standard stores to software_only.`);

    // 3. Update growth -> hardware_bundle
    const res3 = await query("UPDATE stores SET subscription_tier = 'hardware_bundle' WHERE subscription_tier = 'growth'");
    console.log(`Migrated ${res3.rowCount} growth stores to hardware_bundle.`);

    // 4. Update pro -> enterprise
    const res4 = await query("UPDATE stores SET subscription_tier = 'enterprise' WHERE subscription_tier = 'pro'");
    console.log(`Migrated ${res4.rowCount} pro stores to enterprise.`);

    // 5. Update the column default
    await query("ALTER TABLE stores ALTER COLUMN subscription_tier SET DEFAULT 'software_only'");
    console.log('Updated column default to software_only.');

    console.log('--- Migration Complete ---');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateTiers();
