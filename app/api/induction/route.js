import { query, transaction } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    // Fetch orders in 'received' status that need induction
    // We also include orders where at least one item has a placeholder/null tag_id
    const res = await query(`
      SELECT 
        o.id as order_id, 
        o.order_number, 
        o.created_at, 
        o.status as order_status,
        o.bag_id,
        c.name as customer_name,
        c.phone as customer_phone,
        json_agg(json_build_object(
          'id', oi.id,
          'garment_type', oi.garment_type,
          'service_type', oi.service_type,
          'price', oi.price,
          'tag_id', oi.tag_id,
          'image_url', oi.image_url
        )) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.status = 'received' AND o.store_id = $1
      GROUP BY o.id, c.name, c.phone
      ORDER BY o.created_at DESC
    `, [auth.user.store_id]);

    return NextResponse.json(res.rows);
  } catch (error) {
    console.error('Fetch induction error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { order_id, bag_id, items } = await request.json();

    if (!order_id) return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });

    const result = await transaction(async (q) => {
      // 1. Update Order-level Bag ID
      if (bag_id !== undefined) {
        await q(`UPDATE orders SET bag_id = $1 WHERE id = $2 AND store_id = $3`, [bag_id, order_id, auth.user.store_id]);
      }

      // 2. Update each item (Price, Tag ID/Card Scan)
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await q(`
            UPDATE order_items 
            SET 
              tag_id = COALESCE($1, tag_id),
              price = COALESCE($2, price),
              bag_id = COALESCE($3, bag_id)
            WHERE id = $4 AND order_id = $5
          `, [item.tag_id, item.price, bag_id, item.id, order_id]);
        }
      }

      // 3. Optional: Move order to 'processing' if induction is considered complete?
      // For now we keep it in 'received' until the first scan in factory, or we can move it to 'sorting'
      
      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Update induction error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
