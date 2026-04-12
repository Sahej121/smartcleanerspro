import { query } from '../lib/db/db.js';

async function testHealthLogic() {
  try {
    console.log('1. DB Ping...');
    const startTime = Date.now();
    await query('SELECT 1');
    const latency = Date.now() - startTime;
    console.log('Latency:', latency);

    console.log('2. Store Stats...');
    const storeStats = await query('SELECT status, count(*) FROM stores GROUP BY status');
    console.log('Store Stats Rows:', storeStats.rows);

    console.log('3. Logs Count...');
    const logsCount = await query('SELECT count(*) FROM system_logs');
    console.log('Logs Count Row:', logsCount.rows[0]);
    console.log('Total Logs:', logsCount.rows[0].count);

    console.log('Health Logic Success!');
    process.exit(0);
  } catch (err) {
    console.error('HEALTH LOGIC ERROR:', err);
    process.exit(1);
  }
}

testHealthLogic();
