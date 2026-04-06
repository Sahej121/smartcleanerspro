import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const res = await query(`
      SELECT *, 
        CASE 
          WHEN quantity <= reorder_level THEN 'Low Stock'
          WHEN quantity <= reorder_level * 2 THEN 'Medium'
          ELSE 'Optimal'
        END as status,
        CASE
          WHEN historical_daily_burn > 0 THEN ROUND(quantity / historical_daily_burn)
          ELSE NULL
        END as runway_days
      FROM inventory 
      WHERE store_id = $1
      ORDER BY 
        CASE WHEN quantity <= reorder_level THEN 0 ELSE 1 END,
        item_name
    `, [auth.user.store_id]);
    return NextResponse.json(res.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { item_name, quantity, unit, reorder_level } = body;

    if (!item_name) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO inventory (item_name, quantity, unit, reorder_level, store_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [item_name, quantity || 0, unit || 'units', reorder_level || 10, auth.user.store_id]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id, quantity, action } = body;

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    let res;
    if (action === 'receive' && quantity) {
      // Add to existing stock
      res = await query(
        `UPDATE inventory SET quantity = quantity + $1, last_updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND store_id = $3 RETURNING *`,
        [quantity, id, auth.user.store_id]
      );
    } else if (quantity !== undefined) {
      // Get current data to calculate burn rate if it's a reduction
      const currentRes = await query('SELECT quantity, last_updated_at, historical_daily_burn FROM inventory WHERE id = $1 AND store_id = $2', [id, auth.user.store_id]);
      if (currentRes.rows.length === 0) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      const item = currentRes.rows[0];
      let newBurnRate = parseFloat(item.historical_daily_burn) || 0;

      // Only calculate burn if quantity decreased and time has passed
      if (quantity < item.quantity) {
        const now = new Date();
        const lastUpdate = new Date(item.last_updated_at);
        const diffDays = (now - lastUpdate) / (1000 * 60 * 60 * 24);

        if (diffDays > 0.04) { // Roughly 1 hour minimum to calculate a rate
          const consumed = item.quantity - quantity;
          const currentRate = consumed / diffDays;
          
          // Weighted rolling average (70% old, 30% new)
          if (newBurnRate === 0) {
            newBurnRate = currentRate;
          } else {
            newBurnRate = (newBurnRate * 0.7) + (currentRate * 0.3);
          }
        }
      }

      // Set absolute quantity
      res = await query(
        `UPDATE inventory SET quantity = $1, last_updated_at = CURRENT_TIMESTAMP, historical_daily_burn = $2 WHERE id = $3 AND store_id = $4 RETURNING *`,
        [quantity, newBurnRate, id, auth.user.store_id]
      );
    } else {
      return NextResponse.json({ error: 'Quantity is required' }, { status: 400 });
    }

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
