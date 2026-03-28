import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const stages = ['received', 'sorting', 'washing', 'dry_cleaning', 'drying', 'ironing', 'quality_check', 'ready'];
    const result = {};

    for (const stage of stages) {
      const res = await query(`
        SELECT oi.*, o.order_number, o.pickup_status, o.delivery_status, c.name as customer_name
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE oi.status = $1
        ORDER BY oi.created_at ASC
      `, [stage]);
      result[stage] = res.rows;
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { itemId } = await req.json();
    
    // 1. Get current item
    const itemRes = await query('SELECT * FROM order_items WHERE id = $1', [itemId]);
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
      'INSERT INTO garment_workflow (order_item_id, stage, timestamp) VALUES ($1, $2, NOW())',
      [itemId, nextStatus]
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
    const nextTaskDesc = `Process ${item.garment_type} (Order #${item.order_number}) - Item #${itemId} - Stage: ${nextStatus}`;
    await query(
      `INSERT INTO staff_tasks (user_id, task_description, due_date)
       SELECT id, $1, NOW() + INTERVAL '2 hours'
       FROM users 
       WHERE role = 'staff' 
       LIMIT 1`, 
      [nextTaskDesc]
    );

    return NextResponse.json({ success: true, nextStatus });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
