const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cleanflow',
});

async function checkLatest() {
  try {
    const orderRes = await pool.query('SELECT id, order_number FROM orders ORDER BY id DESC LIMIT 1;');
    if (orderRes.rows.length === 0) {
      console.log('No orders found.');
      return;
    }
    const order = orderRes.rows[0];
    console.log(`Latest Order: ${order.order_number} (ID: ${order.id})`);

    const itemRes = await pool.query('SELECT garment_type, tag_id FROM order_items WHERE order_id = $1;', [order.id]);
    console.log('Order Items:');
    console.table(itemRes.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkLatest();
