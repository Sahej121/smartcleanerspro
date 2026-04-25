import { query } from '@/lib/db/db';
import { NextResponse, after } from 'next/server';

import { requireRole } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const stages = ['received', 'sorting', 'washing', 'dry_cleaning', 'drying', 'ironing', 'quality_check', 'ready'];
    const result = {};

    for (const stage of stages) {
      result[stage] = [];
    }

    const res = await query(`
      SELECT oi.*, o.order_number, o.pickup_status, o.delivery_status, c.name as customer_name
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE oi.status = ANY($1) AND o.store_id = $2
      ORDER BY oi.created_at ASC
    `, [stages, auth.user.store_id]);

    for (const row of res.rows) {
      if (result[row.status]) {
        result[row.status].push(row);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { itemId } = await request.json();
    
    // 1. Get current item and full order context
    const itemRes = await query(`
      SELECT oi.*, o.store_id, o.order_number, o.customer_id, c.name as customer_name, c.phone as customer_phone
      FROM order_items oi 
      JOIN orders o ON oi.order_id = o.id 
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE oi.id = $1 AND o.store_id = $2
    `, [itemId, auth.user.store_id]);
    
    const item = itemRes.rows[0];
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    // 2. Determine next stage (linear flow with dry_cleaning branch)
    const STAGE_ORDER = ['received', 'sorting', 'washing', 'dry_cleaning', 'drying', 'ironing', 'quality_check', 'ready'];
    
    let nextStatus;
    const currentIndex = STAGE_ORDER.indexOf(item.status);
    
    if (currentIndex === -1) {
       nextStatus = 'ready'; // fallback
    } else if (currentIndex < STAGE_ORDER.length - 1) {
       nextStatus = STAGE_ORDER[currentIndex + 1];
    } else {
       return NextResponse.json({ message: 'Item already at final stage' });
    }

    // Branching logic: sorting -> dry_cleaning OR washing
    if (item.status === 'sorting') {
      const isDryCleaning = item.service_type?.toLowerCase().includes('dry cleaning');
      nextStatus = isDryCleaning ? 'dry_cleaning' : 'washing';
    }

    // 3. Update DB
    await query('UPDATE order_items SET status = $1 WHERE id = $2', [nextStatus, itemId]);
    
    // 4. Log the transition
    await query(
      'INSERT INTO garment_workflow (order_item_id, stage, updated_by, timestamp) VALUES ($1, $2, $3, NOW())',
      [itemId, nextStatus, auth.user.id]
    );

    // 5. Sync Order Status & Handle Notifications
    const allItemsRes = await query('SELECT status FROM order_items WHERE order_id = $1', [item.order_id]);
    const allItems = allItemsRes.rows;

    const allReady = allItems.every(i => i.status === 'ready' || i.status === 'delivered');
    const anyProcessing = allItems.some(i => !['received', 'ready', 'delivered'].includes(i.status));

    if (allReady) {
      const orderRes = await query('SELECT status FROM orders WHERE id = $1', [item.order_id]);
      if (orderRes.rows[0].status !== 'ready') {
        await query('UPDATE orders SET status = $1 WHERE id = $2', ['ready', item.order_id]);
        
        // Trigger Notification in Background
        after(async () => {
          if (item.customer_phone) {
            const message = `Hi ${item.customer_name}! Your order #${item.order_number} is now READY for pickup/delivery at DrycleanersFlow. See you soon!`;
            try {
              const { sendWhatsAppMessage } = require('@/lib/whatsapp/twilioClient');
              await sendWhatsAppMessage(item.customer_phone, message);
            } catch (notifErr) {
              console.error('Notification failed:', notifErr);
            }
            
            await query(`
              INSERT INTO system_logs (event_type, description, severity, store_id)
              VALUES ($1, $2, $3, $4)
            `, ['STAFF_ALERT', `Notification sent to ${item.customer_name} for Order #${item.order_number}`, 'info', auth.user.store_id]);
          }
        });
      }
    } else if (anyProcessing) {
      await query('UPDATE orders SET status = $1 WHERE id = $2', ['processing', item.order_id]);
    }

    // 6. Automate Task Updates in Background
    after(async () => {
      // Complete previous task if it exists
      await query(
        `UPDATE staff_tasks 
         SET is_completed = TRUE 
         WHERE task_description LIKE $1 AND is_completed = FALSE`,
        [`%Item #${itemId}%Stage: ${item.status}%`]
      );

      // Create next task (only if not ready)
      if (nextStatus !== 'ready') {
        const nextTaskDesc = `Process ${item.garment_type} (Order #${item.order_number}) - Item #${itemId} - Stage: ${nextStatus}`;
        await query(
          `INSERT INTO staff_tasks (user_id, task_description, due_date, store_id)
           SELECT id, $1, NOW() + INTERVAL '2 hours', $2
           FROM users 
           WHERE role = 'staff' AND store_id = $2
           LIMIT 1`, 
          [nextTaskDesc, auth.user.store_id]
        );
      }
    });

    return NextResponse.json({ success: true, nextStatus });
  } catch (error) {
    console.error('Workflow error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
