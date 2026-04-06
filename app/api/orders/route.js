import { query, getClient } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { sanitizeText } from '@/lib/sanitize';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let sql = `
      SELECT o.*, c.name as customer_name, c.phone as customer_phone,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.store_id = $1
    `;
    const conditions = [];
    const params = [auth.user.store_id];
    let paramIndex = 2;

    if (status && status !== 'all') {
      conditions.push(`o.status = $${paramIndex++}`);
      params.push(status);
    }

    if (search) {
      conditions.push(`(o.order_number ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex + 1} OR c.phone ILIKE $${paramIndex + 2})`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }

    if (conditions.length > 0) {
      sql += ' AND ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY o.created_at DESC';

    const res = await query(sql, params);
    return NextResponse.json(res.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const idempotencyKey = request.headers.get('Idempotency-Key');
  const client = await getClient();
  try {
    const body = await request.json();
    const { customer_id, items, payment_method, notes, schedule, force, coupon_id, redeemedPoints: bodyRedeemedPoints } = body;

    // Verify customer belongs to this store
    if (customer_id) {
      const customerCheck = await client.query(
        'SELECT id FROM customers WHERE id = $1 AND store_id = $2',
        [customer_id, auth.user.store_id]
      );
      if (customerCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid customer for this store.' }, { status: 403 });
      }
    }
    
    // Duplicate Order Detection (Last 5 mins)
    if (!force) {
      const recentOrderRes = await client.query(
        `SELECT id FROM orders 
         WHERE customer_id = $1 
         AND created_at > NOW() - INTERVAL '5 minutes'
         AND total_amount IS NOT NULL`, // simplified check for recently active customer
        [customer_id]
      );
      
      if (recentOrderRes.rows.length > 0) {
        // More specific check: same items/total
        // We'll return a 409 Conflict if there's any recent order, let frontend handle 'force'
        return NextResponse.json({ 
          error: 'Possible duplicate order detected.', 
          code: 'DUPLICATE_DETECTED',
          recent_order_id: recentOrderRes.rows[0].id 
        }, { status: 409 });
      }
    }
    
    // Sanitize free-text fields
    const safeNotes = sanitizeText(notes) || '';

    await client.query('BEGIN');

    // Generate order number
    const lastOrderRes = await client.query('SELECT order_number FROM orders ORDER BY id DESC LIMIT 1');
    let nextNum = 1007;
    if (lastOrderRes.rows.length > 0) {
      const num = parseInt(lastOrderRes.rows[0].order_number.replace('CF-', ''));
      nextNum = num + 1;
    }
    const orderNumber = `CF-${nextNum}`;

    // Calculate volume discount
    let totalItems = 0;
    for (const item of items) totalItems += (item.quantity || 1);
    
    const volDiscountRes = await client.query(
      'SELECT discount_percent FROM volume_discounts WHERE is_active = TRUE AND min_quantity <= $1 ORDER BY min_quantity DESC LIMIT 1',
      [totalItems]
    );
    const volDiscountPercent = volDiscountRes.rows.length > 0 ? parseFloat(volDiscountRes.rows[0].discount_percent) : 0;
    
    // Calculate total
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * (item.quantity || 1);
    }
    
    const volumeDiscountAmount = Math.round(subtotal * (volDiscountPercent / 100) * 100) / 100;
    
    // Calculate Coupon Discount
    let couponDiscountAmount = 0;
    if (coupon_id) {
      const couponRes = await client.query(
        'SELECT * FROM coupons WHERE id = $1 AND is_active = TRUE AND (expiry_date IS NULL OR expiry_date > NOW())',
        [coupon_id]
      );
      if (couponRes.rows.length > 0) {
        const coupon = couponRes.rows[0];
        if (subtotal >= parseFloat(coupon.min_order_value)) {
          if (coupon.discount_type === 'percent') {
            couponDiscountAmount = Math.round(subtotal * (parseFloat(coupon.discount_value) / 100) * 100) / 100;
          } else {
            couponDiscountAmount = parseFloat(coupon.discount_value);
          }
        }
      }
    }

    const redeemedPoints = bodyRedeemedPoints || 0;
    const totalDiscount = volumeDiscountAmount + couponDiscountAmount + redeemedPoints;
    const tax = Math.round((subtotal - totalDiscount) * 0.18 * 100) / 100;
    const totalAmount = Math.max(0, subtotal - totalDiscount + tax);

    // Build pickup/delivery dates from schedule
    let pickupDate = null;
    let deliveryDate = null;
    if (schedule) {
      if (schedule.pickupDate) {
        pickupDate = schedule.pickupTime ? `${schedule.pickupDate} ${schedule.pickupTime}` : schedule.pickupDate;
      }
      if (schedule.deliveryDate) {
        deliveryDate = schedule.deliveryTime ? `${schedule.deliveryDate} ${schedule.deliveryTime}` : schedule.deliveryDate;
      }
    }

    // Insert order
    const orderRes = await client.query(
      `INSERT INTO orders (order_number, customer_id, store_id, status, total_amount, discount, tax, payment_status, notes, pickup_date, delivery_date, pickup_status, delivery_status, logistics_notes, coupon_id)
       VALUES ($1, $2, $3, 'received', $4, $5, $6, 'pending', $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [orderNumber, customer_id, auth.user.store_id, totalAmount, totalDiscount, tax, safeNotes, pickupDate, deliveryDate, body.pickup_status || 'pending', body.delivery_status || 'pending', body.logistics_notes || null, coupon_id || null]
    );
    const orderId = orderRes.rows[0].id;

    // Insert items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const tagId = item.tag_id || `${orderNumber}-${i + 1}`;
      const itemRes = await client.query(
        `INSERT INTO order_items (order_id, garment_type, service_type, quantity, price, status, notes, tag_id, bag_id, incident_status, incident_notes)
         VALUES ($1, $2, $3, $4, $5, 'received', $6, $7, $8, $9, $10) RETURNING id`,
        [orderId, item.garment_type, item.service_type, item.quantity || 1, item.price, item.notes || null, tagId, item.bag_id || null, item.incident_status || 'none', item.incident_notes || null]
      );
      await client.query(
        `INSERT INTO garment_workflow (order_item_id, stage, updated_by) VALUES ($1, 'received', $2)`,
        [itemRes.rows[0].id, auth.user.id]
      );
    }

    // Insert payments (handles split / multiple initial payments)
    // body.payments should be an array like [{ method: 'cash', amount: 500, tendered: 600 }]
    const initialPayments = body.payments || [];
    let totalPaid = 0;
    
    for (const p of initialPayments) {
      const pAmount = parseFloat(p.amount || 0);
      if (pAmount > 0) {
        totalPaid += pAmount;
        await client.query(
          `INSERT INTO payments (order_id, amount, payment_method, payment_status, idempotency_key) VALUES ($1, $2, $3, 'completed', $4)`,
          [orderId, pAmount, p.method || 'cash', idempotencyKey ? `${idempotencyKey}_${p.method}` : null]
        );
      }
    }

    // Update payment status based on total paid
    let finalPaymentStatus = 'pending';
    if (totalPaid >= totalAmount) {
      finalPaymentStatus = 'paid';
    } else if (totalPaid > 0) {
      finalPaymentStatus = 'partial';
    }

    await client.query(
      'UPDATE orders SET payment_status = $1, payment_method = $2 WHERE id = $3',
      [finalPaymentStatus, initialPayments[0]?.method || 'cash', orderId]
    );

    // Update customer loyalty points (Earning: 1 point per ₹100 paid)
    if (customer_id && totalPaid > 0) {
      await client.query(
        `UPDATE customers SET loyalty_points = loyalty_points + $1 WHERE id = $2`,
        [Math.floor(totalPaid / 100), customer_id]
      );
    }

    // Handle Point Redemption (Redeeming: 1 point = ₹1 discount)
    const pointsToRedeem = parseInt(body.redeemedPoints || 0);
    if (customer_id && pointsToRedeem > 0) {
      await client.query(
        `UPDATE customers SET loyalty_points = loyalty_points - $1 WHERE id = $2 AND loyalty_points >= $1`,
        [pointsToRedeem, customer_id]
      );
    }

    await client.query('COMMIT');

    const orderResult = await query(
      `SELECT o.*, c.name as customer_name 
       FROM orders o LEFT JOIN customers c ON o.customer_id = c.id 
       WHERE o.id = $1`,
      [orderId]
    );

    return NextResponse.json(orderResult.rows[0], { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
