import { query } from '../lib/db/db.js';

async function test() {
  try {
    console.log('Testing SELECT 1...');
    await query('SELECT 1');
    console.log('SELECT 1 successful.');

    console.log('Testing stores query...');
    const storeStats = await query('SELECT status, count(*) FROM stores GROUP BY status');
    console.log('Stores query successful:', storeStats.rows);

    console.log('Testing system_logs query...');
    const logsCount = await query('SELECT count(*) FROM system_logs');
    console.log('System logs query successful:', logsCount.rows);

    process.exit(0);
  } catch (err) {
    console.error('DATABASE ERROR:', err);
    process.exit(1);
  }
}

test();
