const pg = require('pg');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cleanflow',
});

async function clearDatabase() {
  console.log('--- Starting Database Cleanup ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Transactional & Log Data
    console.log('Clearing transactional data...');
    await client.query('DELETE FROM whatsapp_sessions');
    await client.query('DELETE FROM garment_workflow');
    await client.query('DELETE FROM machine_loads');
    await client.query('DELETE FROM payments');
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM staff_tasks');
    await client.query('DELETE FROM system_logs');

    // 2. Configuration & Master Data
    console.log('Clearing configuration data...');
    await client.query('DELETE FROM pricing');
    await client.query('DELETE FROM inventory');
    await client.query('DELETE FROM machines');
    await client.query('DELETE FROM coupons');
    await client.query('DELETE FROM volume_discounts');
    await client.query('DELETE FROM support_tickets');
    await client.query('DELETE FROM customers');

    // 3. Identity & Structure
    console.log('Clearing identity structure...');
    // We must reset the store_id link on the superadmin before deleting the stores
    await client.query('UPDATE users SET store_id = NULL WHERE id = 1');
    
    // Clear all other users
    await client.query('DELETE FROM users WHERE id != 1');
    
    // Clear all stores
    await client.query('DELETE FROM stores');

    await client.query('COMMIT');
    console.log('--- Cleanup Successful ---');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('--- Cleanup Failed ---');
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

clearDatabase();
