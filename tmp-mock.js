import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  console.log('Seeding logistics mock data...');
  try {
    const custRes = await pool.query(`SELECT id FROM customers LIMIT 1`);
    let customerId = custRes.rows[0]?.id;
    if (!customerId) {
       const newCust = await pool.query(`INSERT INTO customers (name, email, phone, address, store_id) VALUES ('Driver Joe Client', 'joe@test.com', '+1555555555', '123 Delivery Ln, NY', 1) RETURNING id`);
       customerId = newCust.rows[0].id;
    }
    
    await pool.query(`
      INSERT INTO orders (order_number, customer_id, store_id, total_amount, payment_status, status, pickup_status, delivery_status, logistics_notes) VALUES
      ('ORD-PKUP-99', $1, 1, 45.00, 'pending', 'pending', 'scheduled', 'pending', 'Gate code 1234'),
      ('ORD-DELV-88', $1, 1, 80.00, 'paid', 'ready', 'completed', 'scheduled', 'Leave at door')
    `, [customerId]);

    console.log('Logistics seeded successfully.');
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

seed();
