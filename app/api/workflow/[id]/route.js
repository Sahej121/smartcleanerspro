import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/whatsapp/twilioClient';

const STAGE_ORDER = ['received', 'sorting', 'washing', 'dry_cleaning', 'drying', 'ironing', 'quality_check', 'ready'];

export async function PUT(request, { params }) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // 'advance' or 'reject'

    const itemRes = await query(
      'SELECT oi.*, o.store_id FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.id = $1 AND o.store_id = $2', 
      [id, auth.user.store_id]
    );
    if (itemRes.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    const item = itemRes.rows[0];

    let newStage;
    if (action === 'reject') {
      // Send back to washing
      newStage = 'washing';
    } else {
      const currentIndex = STAGE_ORDER.indexOf(item.status);
      if (currentIndex >= STAGE_ORDER.length - 1) {
        return NextResponse.json({ error: 'Item is already at final stage' }, { status: 400 });
      }
      newStage = STAGE_ORDER[currentIndex + 1];
    }

    await query('UPDATE order_items SET status = $1 WHERE id = $2', [newStage, id]);

    // Add workflow entry
    await query(
      `INSERT INTO garment_workflow (order_item_id, stage, updated_by) VALUES ($1, $2, $3)`,
      [id, newStage, auth.user.id]
    );

    // Update order status based on items
    const allItemsRes = await query('SELECT status FROM order_items WHERE order_id = $1', [item.order_id]);
    const allItems = allItemsRes.rows;

    const allReady = allItems.every(i => i.status === 'ready' || i.status === 'delivered');
    const anyProcessing = allItems.some(i => !['received', 'ready', 'delivered'].includes(i.status));

    if (allReady) {
      const orderRes = await query('SELECT status FROM orders WHERE id = $1', [item.order_id]);
      if (orderRes.rows[0].status !== 'ready') {
        await query('UPDATE orders SET status = $1 WHERE id = $2', ['ready', item.order_id]);
        
        // Trigger Notification
        const customerRes = await query(`
          SELECT c.phone, c.name, o.order_number 
          FROM orders o 
          JOIN customers c ON o.customer_id = c.id 
          WHERE o.id = $1
        `, [item.order_id]);
        
        if (customerRes.rows.length > 0) {
          const customer = customerRes.rows[0];
          const message = `Hi ${customer.name}! Your order #${customer.order_number} is now READY for pickup/delivery at DrycleanersFlow. See you soon!`;
          await sendWhatsAppMessage(customer.phone, message);
          
          // Log notification event for frontdesk
          await query(`
            INSERT INTO system_logs (event_type, description, severity, store_id)
            VALUES ($1, $2, $3, $4)
          `, ['STAFF_ALERT', `Notification sent to ${customer.name} for Order #${customer.order_number}`, 'info', auth.user.store_id]);
        }
      }
    } else if (anyProcessing) {
      await query('UPDATE orders SET status = $1 WHERE id = $2', ['processing', item.order_id]);
    }

    return NextResponse.json({ success: true, newStage });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
