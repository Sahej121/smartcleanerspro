const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cleanflow',
});

async function checkWAOrders() {
  try {
    const res = await pool.query("SELECT id, order_number, created_at FROM orders WHERE order_number LIKE 'WA-%' ORDER BY created_at DESC LIMIT 5;");
    console.log('WA Orders:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkWAOrders();
