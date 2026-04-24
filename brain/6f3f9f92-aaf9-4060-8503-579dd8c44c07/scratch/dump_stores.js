const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/cleanflow',
});

async function run() {
  const res = await pool.query("SELECT id, store_name, subscription_tier, status, owner_id, country FROM stores WHERE store_name ILIKE '%auckland%' OR store_name ILIKE '%NewZealand%';");
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}

run().catch(console.error);
