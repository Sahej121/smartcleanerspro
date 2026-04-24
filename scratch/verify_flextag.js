const { query } = require('../lib/db/db');

async function testFlexTag() {
  console.log('--- FlexTag Verification ---');
  
  // 1. Check existing tag
  const check = await query("SELECT tag_id, order_id FROM order_items WHERE tag_id LIKE '%8775-1%' LIMIT 1");
  if (check.rows.length === 0) {
    console.log('Record WA-8775-1 not found in seeding. Skipping detailed test.');
    return;
  }
  
  const targetTag = check.rows[0].tag_id;
  const orderId = check.rows[0].order_id;
  console.log(`Found Target: ${targetTag} (Order ID: ${orderId})`);

  const testInputs = [
    targetTag,           // Exact: WA-8775-1
    '8775-1',            // No prefix
    '8775',              // Order only
    'WA-8775'            // Order prefix
  ];

  for (const input of testInputs) {
    const res = await query(`
        SELECT oi.tag_id, o.order_number
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.store_id = 1
          AND (
            oi.tag_id = $1
            OR oi.tag_id = 'WA-' || $1
            OR oi.tag_id = 'CF-' || $1
            OR oi.tag_id LIKE '%' || $1
            OR o.order_number = $1
            OR o.order_number = 'WA-' || $1
            OR o.order_number = 'CF-' || $1
          )
          AND oi.status != 'delivered'
        ORDER BY 
          CASE 
            WHEN oi.tag_id = $1 THEN 1
            WHEN oi.tag_id LIKE '%' || $1 THEN 2
            WHEN o.order_number = $1 THEN 3
            ELSE 4
          END,
          oi.id ASC
        LIMIT 1
    `, [input]);

    if (res.rows.length > 0) {
      console.log(`PASS: Input "${input}" matched ${res.rows[0].tag_id}`);
    } else {
      console.log(`FAIL: Input "${input}" matched NOTHING`);
    }
  }
}

testFlexTag().then(() => process.exit()).catch(e => { console.error(e); process.exit(1); });
