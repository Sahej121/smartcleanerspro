import { query, transaction } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

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
      // 1. Find the item
      const itemRes = await q(`
        SELECT oi.*, o.order_number, o.store_id, o.status as order_status
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.tag_id = $1 AND o.store_id = $2
      `, [tag_id, auth.user.store_id]);

      if (itemRes.rows.length === 0) {
        throw new Error(`Item with Tag ID ${tag_id} not found.`);
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
         await q(`UPDATE orders SET status = 'ready' WHERE id = $1`, [item.order_id]);
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
