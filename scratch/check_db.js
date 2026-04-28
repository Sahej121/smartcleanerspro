const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cleanflow',
});

async function checkTags() {
  try {
    const res = await pool.query('SELECT garment_type, tag_id FROM order_items ORDER BY id DESC LIMIT 2;');
    console.log('Database Results:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error querying database:', err.message);
  } finally {
    await pool.end();
  }
}

checkTags();
