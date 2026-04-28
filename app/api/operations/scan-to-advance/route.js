import { query, transaction } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/whatsapp/twilioClient';

const STAGE_ORDER = ['received', 'sorting', 'washing', 'dry_cleaning', 'drying', 'ironing', 'quality_check', 'ready', 'delivered'];

export async function POST(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { tag_id, station_id } = await request.json();

    if (!tag_id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // Use a transaction for atomic update and logging
    const result = await transaction(async (q) => {
      // 1. Find the item using FlexTag logic (Exact match > Partial match > Order match)
      const itemRes = await q(`
        SELECT oi.*, o.order_number, o.store_id, o.status as order_status
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.store_id = $2
          AND (
            oi.tag_id ILIKE $1                      -- Exact Tag Match (Case Insensitive)
            OR oi.tag_id ILIKE 'WA-' || $1          -- Missing 'WA-' Prefix
            OR oi.tag_id ILIKE 'CF-' || $1          -- Missing 'CF-' Prefix
            OR oi.tag_id ILIKE '%' || $1            -- End-of-Tag match (e.g. 8775-1)
            OR o.order_number ILIKE $1              -- Order Number Match (pick first item)
            OR o.order_number ILIKE 'WA-' || $1 
            OR o.order_number ILIKE 'CF-' || $1
          )
          AND oi.status != 'delivered'           -- Don't match already completed items
        ORDER BY 
          CASE 
            WHEN oi.tag_id ILIKE $1 THEN 1
            WHEN oi.tag_id ILIKE '%' || $1 THEN 2
            WHEN o.order_number ILIKE $1 THEN 3
            ELSE 4
          END,
          oi.id ASC
        LIMIT 1
      `, [tag_id, auth.user.store_id]);

      if (itemRes.rows.length === 0) {
        throw new Error(`Item with Tag ID/Ref "${tag_id}" not found in active pool.`);
      }

      const item = itemRes.rows[0];
      const currentStatus = item.status;
      const currentIndex = STAGE_ORDER.indexOf(currentStatus);

      if (currentIndex === -1) {
        throw new Error(`Invalid current status: ${currentStatus}`);
      }

      if (currentIndex === STAGE_ORDER.length - 1) {
        throw new Error(`Garment is already delivered.`);
      }

      const nextStatus = STAGE_ORDER[currentIndex + 1];

      // 2. Update item status
      await q(`
        UPDATE order_items 
        SET status = $1, created_at = NOW() -- track last update time loosely here or add updated_at
        WHERE id = $2
      `, [nextStatus, item.id]);

      // 3. Log to garment_workflow
      await q(`
        INSERT INTO garment_workflow (order_item_id, stage, updated_by, notes)
        VALUES ($1, $2, $3, $4)
      `, [item.id, nextStatus, auth.user.id, station_id ? `Station: ${station_id}` : 'Scanned to advance']);

      // 4. Detailed audit log for the store
      await q(`
        INSERT INTO system_logs (event_type, description, severity, store_id)
        VALUES ($1, $2, $3, $4)
      `, ['PRODUCTION_SCAN', `Item ${item.garment_type} (${tag_id}) advanced to ${nextStatus} by ${auth.user.name} at ${station_id || 'mobile'}`, 'info', auth.user.store_id]);

      // 5. Check if all items in this order are now at least the same stage
      // and maybe update the main order status if they are all 'ready'
      const orderItemsRes = await q(`
        SELECT status FROM order_items WHERE order_id = $1
      `, [item.order_id]);
      
      const allReady = orderItemsRes.rows.every(oi => oi.status === 'ready' || oi.status === 'delivered');
      if (allReady && item.order_status !== 'ready') {
         // Update order status
         await q(`UPDATE orders SET status = 'ready' WHERE id = $1`, [item.order_id]);

         // Trigger Notification
         const customerRes = await q(`
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
           await q(`
             INSERT INTO system_logs (event_type, description, severity, store_id)
             VALUES ($1, $2, $3, $4)
           `, ['STAFF_ALERT', `Notification sent to ${customer.name} for Order #${customer.order_number}`, 'info', auth.user.store_id]);
         }
      }

      return {
        item: { ...item, status: nextStatus },
        nextStatus,
        order_id: item.order_id,
        order_number: item.order_number
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Scan-to-advance error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
