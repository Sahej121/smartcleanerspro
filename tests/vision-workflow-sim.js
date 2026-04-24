import { query } from '../lib/db/db.js';
import { sendWhatsAppMessage } from '../lib/whatsapp/twilioClient.js';

// We'll mimic the server logic but in an isolated script to verify the data flow
async function runVisionSimulation() {
  console.log('--- STARTING VISION WORKFLOW SIMULATION ---');

  try {
    const storeId = 1;
    const customerPhone = '+91-9811001001'; // Arjun Mehta

    // 1. WhatsApp Collection (The 'Open Ticket' phase)
    console.log('[Phase 1] WhatsApp Collection...');
    const orderNumber = 'WA-TEST-' + Math.floor(Math.random() * 10000);
    const orderRes = await query(
      `INSERT INTO orders (order_number, customer_id, store_id, status, total_amount) 
       VALUES ($1, (SELECT id FROM customers WHERE phone = $2), $3, 'received', 0) RETURNING id`,
      [orderNumber, customerPhone, storeId]
    );
    const orderId = orderRes.rows[0].id;

    const itemRes = await query(
      `INSERT INTO order_items (order_id, garment_type, service_type, quantity, price, status, tag_id) 
       VALUES ($1, 'Shirt', 'Dry Cleaning', 1, 0, 'received', $2) RETURNING id`,
      [orderId, `PLACEHOLDER-${orderId}-1`]
    );
    const itemId = itemRes.rows[0].id;
    console.log(`Order ${orderNumber} created with placeholder tag.`);

    // 2. Front Desk Induction
    console.log('[Phase 2] Front Desk Induction...');
    const plasticCardId = 'CARD-' + Math.floor(Math.random() * 999999);
    const physicalBagId = 'BAG-' + Math.floor(Math.random() * 999);
    const actualPrice = 120;

    // This mimics the /api/induction PUT logic
    await query(`UPDATE orders SET bag_id = $1, status = 'received' WHERE id = $2`, [physicalBagId, orderId]);
    await query(`UPDATE order_items SET tag_id = $1, price = $2, bag_id = $3 WHERE id = $4`, [plasticCardId, actualPrice, physicalBagId, itemId]);
    console.log(`Induction complete: Linked card ${plasticCardId} to Bag ${physicalBagId}`);

    // 3. Factory Scans (The Workflow)
    const stages = ['received', 'sorting', 'washing', 'ironing', 'quality_check', 'ready'];
    console.log('[Phase 3] Advancing through factory stages...');

    for (let i = 1; i < stages.length; i++) {
      const nextStage = stages[i];
      console.log(`Scanning at ${nextStage} station...`);
      
      // Mimic scan-to-advance logic
      await query(`UPDATE order_items SET status = $1 WHERE id = $2`, [nextStage, itemId]);
      
      // Log workflow
      await query(`INSERT INTO garment_workflow (order_item_id, stage, updated_by) VALUES ($1, $2, 1)`, [itemId, nextStage]);

      // Check for completion notification (The new logic we just added)
      if (nextStage === 'ready') {
        const allItemsRes = await query('SELECT status FROM order_items WHERE order_id = $1', [orderId]);
        const allReady = allItemsRes.rows.every(oi => oi.status === 'ready');
        
        if (allReady) {
          console.log('>>> Order reached READY state! Triggering notification...');
          await query(`UPDATE orders SET status = 'ready' WHERE id = $1`, [orderId]);
          
          const customerRes = await query(`
            SELECT c.phone, c.name, o.order_number 
            FROM orders o 
            JOIN customers c ON o.customer_id = c.id 
            WHERE o.id = $1
          `, [orderId]);
          
          const customer = customerRes.rows[0];
          const message = `Hi ${customer.name}! Your order #${customer.order_number} is now READY for pickup/delivery at CleanFlow. See you soon!`;
          
          // Execute the actual helper
          await sendWhatsAppMessage(customer.phone, message);
        }
      }
    }

    console.log('--- SIMULATION COMPLETE ---');
    process.exit(0);
  } catch (err) {
    console.error('Simulation Failed:', err);
    process.exit(1);
  }
}

runVisionSimulation();
