import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const stages = ['received', 'sorting', 'washing', 'dry_cleaning', 'drying', 'ironing', 'quality_check', 'ready'];
    const result = {};

    for (const stage of stages) {
      const res = await query(`
        SELECT oi.*, o.order_number, o.pickup_status, o.delivery_status, c.name as customer_name
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE oi.status = $1 AND o.store_id = $2
        ORDER BY oi.created_at ASC
      `, [stage, auth.user.store_id]);
      result[stage] = res.rows;
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
    
    // 1. Get current item
    const itemRes = await query(
      'SELECT oi.*, o.store_id FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.id = $1 AND o.store_id = $2', 
      [itemId, auth.user.store_id]
    );
    const item = itemRes.rows[0];
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    // 2. Determine next stage
    const flow = ['received', 'sorting', 'washing', 'drying', 'ironing', 'quality_check', 'ready'];
    
    // Custom logic: if it's dry cleaning, skip washing/drying if needed, but for simplicity let's stick to a linear flow or small branch
    let nextStatus;
    const currentIndex = flow.indexOf(item.status);
    
    if (currentIndex === -1) {
       // Handle cases like 'dry_cleaning' which might be a parallel to 'washing'
       if (item.status === 'dry_cleaning') nextStatus = 'drying';
       else nextStatus = 'ready'; // fallback
    } else if (currentIndex < flow.length - 1) {
       nextStatus = flow[currentIndex + 1];
    } else {
       return NextResponse.json({ message: 'Item already at final stage' });
    }

    // Branching logic for dry cleaning
    if (item.status === 'sorting' && item.service_type.toLowerCase().includes('dry cleaning')) {
      nextStatus = 'dry_cleaning';
    }

    // 3. Update DB
    await query('UPDATE order_items SET status = $1 WHERE id = $2', [nextStatus, itemId]);
    
    // 4. Log the transition
    await query(
      'INSERT INTO garment_workflow (order_item_id, stage, updated_by, timestamp) VALUES ($1, $2, $3, NOW())',
      [itemId, nextStatus, auth.user.id]
    );

    // 5. Automate Task Updates
    // Complete previous task if it exists
    await query(
      `UPDATE staff_tasks 
       SET is_completed = TRUE 
       WHERE task_description LIKE $1 AND is_completed = FALSE`,
      [`%Item #${itemId}%Stage: ${item.status}%`]
    );

    // Create next task
    const nextTaskDesc = `Process ${itemRes.rows[0].garment_type} (Order #${itemRes.rows[0].order_number}) - Item #${itemId} - Stage: ${nextStatus}`;
    await query(
      `INSERT INTO staff_tasks (user_id, task_description, due_date, store_id)
       SELECT id, $1, NOW() + INTERVAL '2 hours', $2
       FROM users 
       WHERE role = 'staff' AND store_id = $2
       LIMIT 1`, 
      [nextTaskDesc, auth.user.store_id]
    );

    return NextResponse.json({ success: true, nextStatus });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
