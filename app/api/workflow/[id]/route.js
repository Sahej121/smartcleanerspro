import { getDb } from '@/lib/db/db';
import { NextResponse } from 'next/server';

const STAGE_ORDER = ['received', 'sorting', 'washing', 'dry_cleaning', 'drying', 'ironing', 'quality_check', 'ready'];

export async function PUT(request, { params }) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();
    const { action } = body; // 'advance' or 'reject'

    const item = db.prepare('SELECT * FROM order_items WHERE id = ?').get(id);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

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

    db.prepare('UPDATE order_items SET status = ? WHERE id = ?').run(newStage, id);

    // Add workflow entry
    db.prepare(`INSERT INTO garment_workflow (order_item_id, stage, updated_by) VALUES (?, ?, 1)`)
      .run(id, newStage);

    // Update order status based on items
    const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(item.order_id);
    const allItems = db.prepare('SELECT status FROM order_items WHERE order_id = ?').all(item.order_id);

    const allReady = allItems.every(i => i.status === 'ready' || i.status === 'delivered');
    const anyProcessing = allItems.some(i => !['received', 'ready', 'delivered'].includes(i.status));

    if (allReady) {
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('ready', item.order_id);
    } else if (anyProcessing) {
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('processing', item.order_id);
    }

    return NextResponse.json({ success: true, newStage });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
