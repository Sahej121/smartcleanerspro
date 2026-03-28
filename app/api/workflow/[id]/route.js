import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';

const STAGE_ORDER = ['received', 'sorting', 'washing', 'dry_cleaning', 'drying', 'ironing', 'quality_check', 'ready'];

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body; // 'advance' or 'reject'

    const itemRes = await query('SELECT * FROM order_items WHERE id = $1', [id]);
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
      `INSERT INTO garment_workflow (order_item_id, stage, updated_by) VALUES ($1, $2, 1)`,
      [id, newStage]
    );

    // Update order status based on items
    const allItemsRes = await query('SELECT status FROM order_items WHERE order_id = $1', [item.order_id]);
    const allItems = allItemsRes.rows;

    const allReady = allItems.every(i => i.status === 'ready' || i.status === 'delivered');
    const anyProcessing = allItems.some(i => !['received', 'ready', 'delivered'].includes(i.status));

    if (allReady) {
      await query('UPDATE orders SET status = $1 WHERE id = $2', ['ready', item.order_id]);
    } else if (anyProcessing) {
      await query('UPDATE orders SET status = $1 WHERE id = $2', ['processing', item.order_id]);
    }

    return NextResponse.json({ success: true, newStage });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
