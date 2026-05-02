import { NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db/db';
import { requireRole } from '@/lib/auth';

export async function PATCH(req, { params }) {
  try {
    const auth = await requireRole(req, ['owner', 'manager']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const payload = auth.user;

    const { id } = await params;
    const body = await req.json();
    const { store_name, city, address, phone, branding, status } = body;

    // Check ownership or assignment
    const storeCheck = await query(`SELECT owner_id FROM stores WHERE id = $1`, [id]);
    if (storeCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (payload.role === 'manager' && payload.store_id !== parseInt(id)) {
        return NextResponse.json({ error: 'Forbidden: You can only edit your own store' }, { status: 403 });
    }

    if (payload.role === 'owner' && payload.role !== 'superadmin' && storeCheck.rows[0].owner_id !== payload.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (store_name !== undefined) {
      updates.push(`store_name = $${paramCount++}`);
      values.push(store_name);
    }
    if (city !== undefined) {
      updates.push(`city = $${paramCount++}`);
      values.push(city);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(address);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (branding !== undefined) {
      updates.push(`branding = $${paramCount++}`);
      values.push(JSON.stringify(branding));
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }


    if (updates.length === 0) {
      return NextResponse.json({ success: true });
    }

    values.push(id);
    
    await query(
      `UPDATE stores SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update store error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await requireRole(req, ['owner']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const payload = auth.user;
    const { id } = await params;

    // Strict Superadmin Check
    if (payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Only the Superadmin can delete nodes' }, { status: 403 });
    }

    // Use the proper transaction helper — it runs all queries on a SINGLE
    // client connection so BEGIN/COMMIT/ROLLBACK actually work.
    const result = await transaction(async (q) => {
      // 1. Machine loads (no store_id — join through machines)
      await q(`DELETE FROM machine_loads WHERE machine_id IN (SELECT id FROM machines WHERE store_id = $1)`, [id]);
      
      // 2. Garment workflow (no store_id — join through order_items → orders)
      await q(`DELETE FROM garment_workflow WHERE order_item_id IN (
        SELECT oi.id FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.store_id = $1
      )`, [id]);

      // 3. WhatsApp sessions (FK → users, stores)
      await q(`DELETE FROM whatsapp_sessions WHERE store_id = $1`, [id]);

      // 4. Staff tasks (FK → users)
      await q(`DELETE FROM staff_tasks WHERE store_id = $1`, [id]);

      // 5. Coupons referenced by orders in this store — clear the FK first
      await q(`UPDATE orders SET coupon_id = NULL WHERE store_id = $1 AND coupon_id IS NOT NULL`, [id]);

      // 6. Delete coupons (store_id column may not exist in older DBs — use SAVEPOINT)
      await q(`SAVEPOINT sp_coupons`);
      try { await q(`DELETE FROM coupons WHERE store_id = $1`, [id]); } catch(e) { await q(`ROLLBACK TO SAVEPOINT sp_coupons`); }

      // 7. Orders — cascades to order_items and payments
      await q(`DELETE FROM orders WHERE store_id = $1`, [id]);

      // 8. Customers (must come after orders due to orders.customer_id FK)
      await q(`DELETE FROM customers WHERE store_id = $1`, [id]);

      // 9. Users (must come after garment_workflow & staff_tasks)
      await q(`DELETE FROM users WHERE store_id = $1`, [id]);

      // 10. Machines (must come after machine_loads)
      await q(`DELETE FROM machines WHERE store_id = $1`, [id]);

      // 11. Config / operational tables
      await q(`DELETE FROM inventory WHERE store_id = $1`, [id]);
      await q(`DELETE FROM pricing WHERE store_id = $1`, [id]);
      await q(`SAVEPOINT sp_voldiscount`);
      try { await q(`DELETE FROM volume_discounts WHERE store_id = $1`, [id]); } catch(e) { await q(`ROLLBACK TO SAVEPOINT sp_voldiscount`); }
      await q(`DELETE FROM system_logs WHERE store_id = $1`, [id]);
      
      // 12. Finally the store itself
      const res = await q(`DELETE FROM stores WHERE id = $1 RETURNING store_name`, [id]);
      
      if (res.rows.length === 0) {
        throw new Error('Store not found');
      }

      return res.rows[0].store_name;
    });

    console.log(`[STORE DELETE] Store "${result}" (ID: ${id}) deleted by superadmin.`);
    return NextResponse.json({ success: true, message: `Store "${result}" and all associated data deleted.` });

  } catch (error) {
    console.error('Delete store error:', error);
    const msg = error.message === 'Store not found' ? 'Store not found' : 'Internal Server Error: ' + error.message;
    const status = error.message === 'Store not found' ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
