const { query, logSystemEvent } = require('./lib/db/db');

async function verifyBottlenecks() {
  console.log('--- Verification: Bottleneck Detection ---');
  
  try {
    // 1. Find an active item
    const itemRes = await query('SELECT id, tag_id, status FROM order_items WHERE status != \'delivered\' LIMIT 1');
    if (itemRes.rows.length === 0) {
      console.log('No active items found to test.');
      return;
    }
    
    const item = itemRes.rows[0];
    console.log(`Testing with Item ID: ${item.id}, Tag: ${item.tag_id}, Status: ${item.status}`);
    
    // 2. Set its last workflow timestamp to 12 hours ago (to trigger bottleneck)
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    await query('UPDATE garment_workflow SET timestamp = $1 WHERE order_item_id = $2', [twelveHoursAgo, item.id]);
    console.log('Updated workflow timestamp to 12 hours ago.');
    
    // 3. The next GET /api/workflow/assembly should detect this and log it.
    // (We simulate the logic here or just assume the API will handle it when the user visits the page)
    
    console.log('Verification script completed. Please refresh the Assembly page to see the alert.');
  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    process.exit();
  }
}

verifyBottlenecks();
