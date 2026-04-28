const { query } = require('../lib/db/db');
async function test() {
  const itemsRes = await query(
    `SELECT oi.*, 
      (SELECT STRING_AGG(gw.stage || ':::' || gw.timestamp, '|' ORDER BY gw.timestamp) 
       FROM garment_workflow gw WHERE gw.order_item_id = oi.id) as workflow_history
     FROM order_items oi WHERE oi.order_id = 45`
  );
  console.log(itemsRes.rows[0]);
}
test().catch(console.error).finally(() => process.exit(0));
