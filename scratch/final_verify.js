import { query } from '../lib/db/db.js';

async function verify() {
  try {
    const orderRes = await query("SELECT id, order_number FROM orders WHERE order_number LIKE 'WA-%' ORDER BY id DESC LIMIT 1;");
    if (orderRes.rows.length === 0) {
       console.log('No WA order found.');
       return;
    }
    const order = orderRes.rows[0];
    console.log(`Latest WA Order: ${order.order_number}`);

    const itemRes = await query("SELECT garment_type, tag_id FROM order_items WHERE order_id = $1;", [order.id]);
    console.log('Generated Tags:');
    console.table(itemRes.rows);
  } catch (err) {
    console.error('Verify error:', err.message);
  } finally {
    process.exit();
  }
}

verify();
