import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/cleanflow',
});

async function fixDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Identify duplicates based on phone number
    const dupRes = await client.query(`
      SELECT phone, COUNT(*) FROM customers 
      WHERE phone IS NOT NULL AND phone != '' 
      GROUP BY phone HAVING COUNT(*) > 1
    `);
    
    console.log(`Found ${dupRes.rows.length} duplicate phone(s).`);

    for (const row of dupRes.rows) {
      const phone = row.phone;
      console.log(`Processing duplicate phone: ${phone}`);
      
      const custRes = await client.query('SELECT id FROM customers WHERE phone = $1 ORDER BY id ASC', [phone]);
      const ids = custRes.rows.map(r => r.id);
      
      const primaryId = ids[0];
      const duplicateIds = ids.slice(1);
      
      // Merge orders to primary
      for (const dupId of duplicateIds) {
        await client.query('UPDATE orders SET customer_id = $1 WHERE customer_id = $2', [primaryId, dupId]);
        await client.query('DELETE FROM customers WHERE id = $1', [dupId]);
        console.log(`Merged orders from customer ${dupId} to ${primaryId} and deleted ${dupId}`);
      }
    }
    
    // 2. Add Unique Constraint on phone
    console.log('Adding UNIQUE constraint to customers(phone)...');
    try {
      await client.query('ALTER TABLE customers ADD CONSTRAINT unique_phone UNIQUE (phone);');
    } catch (e) {
      if (e.code === '42P16') {
         console.log('Constraint already exists.');
      } else {
         throw e;
      }
    }

    // 3. Add idempotency_key to payments
    console.log('Adding idempotency_key to payments...');
    try {
      await client.query('ALTER TABLE payments ADD COLUMN idempotency_key TEXT UNIQUE;');
    } catch (e) {
      if (e.code === '42701') {
         console.log('Column idempotency_key already exists.');
      } else {
         throw e;
      }
    }

    await client.query('COMMIT');
    console.log('Database fixes applied successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to fix database:', error);
  } finally {
    client.release();
    pool.end();
  }
}

fixDb();
