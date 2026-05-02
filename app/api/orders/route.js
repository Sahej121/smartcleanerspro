import { query, getClient } from '@/lib/db/db';
import { NextResponse, after } from 'next/server';
import { requireRole } from '@/lib/auth';
import { sanitizeText } from '@/lib/sanitize';
import { inngest } from '@/lib/inngest';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit')) || 50, 200);
    const page = Math.max(parseInt(searchParams.get('page')) || 1, 1);
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        o.*, 
        c.name as customer_name, 
        c.phone as customer_phone,
        COUNT(oi.id) as item_count,
        COUNT(*) OVER() as total_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
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

    sql += ` GROUP BY o.id, c.name, c.phone ORDER BY o.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const res = await query(sql, params);
    
    // Cache for 10 seconds to reduce DB load during high-traffic POS usage
    return NextResponse.json({
      orders: res.rows,
      pagination: {
        total: res.rows.length > 0 ? parseInt(res.rows[0].total_count) : 0,
        page,
        limit
      }
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=5',
      },
    });
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

    let totalItems = 0;
    for (const item of items) totalItems += (item.quantity || 1);

    const [
      customerCheckRes,
      recentOrderRes,
      seqRes,
      volDiscountRes,
      couponRes
    ] = await Promise.all([
      customer_id ? client.query('SELECT id FROM customers WHERE id = $1 AND store_id = $2', [customer_id, auth.user.store_id]) : Promise.resolve({rows:[]}),
      (!force && customer_id) ? client.query(`SELECT id FROM orders WHERE customer_id = $1 AND created_at > NOW() - INTERVAL '5 minutes' AND total_amount IS NOT NULL`, [customer_id]) : Promise.resolve({rows:[]}),
      client.query("SELECT nextval('order_number_seq')"),
      client.query('SELECT discount_percent FROM volume_discounts WHERE is_active = TRUE AND min_quantity <= $1 ORDER BY min_quantity DESC LIMIT 1', [totalItems]),
      coupon_id ? client.query('SELECT * FROM coupons WHERE id = $1 AND is_active = TRUE AND (expiry_date IS NULL OR expiry_date > NOW())', [coupon_id]) : Promise.resolve({rows:[]})
    ]);

    // Verify customer belongs to this store
    if (customer_id && customerCheckRes.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid customer for this store.' }, { status: 403 });
    }
    
    // Duplicate Order Detection (Last 5 mins)
    if (!force && recentOrderRes.rows.length > 0) {
      return NextResponse.json({ 
        error: 'Possible duplicate order detected.', 
        code: 'DUPLICATE_DETECTED',
        recent_order_id: recentOrderRes.rows[0].id 
      }, { status: 409 });
    }
    
    // Sanitize free-text fields
    const safeNotes = sanitizeText(notes) || '';

    await client.query('BEGIN');

    // Generate order number atomically
    const prefix = (schedule && schedule.pickupDate) ? 'WA' : 'CF';
    const orderNumber = `${prefix}-${seqRes.rows[0].nextval}`;

    const volDiscountPercent = volDiscountRes.rows.length > 0 ? parseFloat(volDiscountRes.rows[0].discount_percent) : 0;
    
    // Calculate total
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * (item.quantity || 1);
    }
    
    const volumeDiscountAmount = Math.round(subtotal * (volDiscountPercent / 100) * 100) / 100;
    
    // Calculate Coupon Discount
    let couponDiscountAmount = 0;
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

    // Insert items in bulk
    if (items.length > 0) {
      const itemValues = [];
      const itemParams = [];
      let paramIndex = 1;
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const tagId = item.tag_id || `${orderNumber}-${i + 1}`;
        itemValues.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, 'received', $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
        itemParams.push(orderId, item.garment_type, item.service_type, item.quantity || 1, item.price, item.notes || null, tagId, item.bag_id || null, item.incident_status || 'none', item.incident_notes || null);
      }
      
      const itemRes = await client.query(
        `INSERT INTO order_items (order_id, garment_type, service_type, quantity, price, status, notes, tag_id, bag_id, incident_status, incident_notes)
         VALUES ${itemValues.join(', ')} RETURNING id`,
        itemParams
      );

      const workflowValues = [];
      const workflowParams = [];
      paramIndex = 1;

      for (let i = 0; i < itemRes.rows.length; i++) {
        workflowValues.push(`($${paramIndex++}, 'received', $${paramIndex++})`);
        workflowParams.push(itemRes.rows[i].id, auth.user.id);
      }

      await client.query(
        `INSERT INTO garment_workflow (order_item_id, stage, updated_by) VALUES ${workflowValues.join(', ')}`,
        workflowParams
      );
    }

    // ── Auto-decrement inventory based on order items ──
    // Best-effort: inventory issues must never block order creation
    after(async () => {
      const bgClient = await getClient();
      try {
        const storeId = auth.user.store_id;
        let totalGarments = 0;
        let washKg = 0;
        let dryCleanPieces = 0;

        for (const item of items) {
          const qty = item.quantity || 1;
          totalGarments += qty;

          const svc = (item.service_type || '').toLowerCase();
          if (svc.includes('wash') || svc.includes('fold') || svc.includes('laundry')) {
            washKg += qty;
          }
          if (svc.includes('dry clean') || svc.includes('dryclean')) {
            dryCleanPieces += qty;
          }
        }

        // Helper: decrement an inventory item by name pattern
        const decrement = async (pattern, amount) => {
          if (amount <= 0) return;
          await bgClient.query(
            `UPDATE inventory SET quantity = GREATEST(0, quantity - $1),
               last_updated_at = CURRENT_TIMESTAMP
             WHERE store_id = $2 AND item_name ILIKE $3`,
            [amount, storeId, pattern]
          );
        };

        const decrements = [];
        // Per-garment consumables
        decrements.push(decrement('%Hanger%', totalGarments));
        decrements.push(decrement('%Garment Bag%', totalGarments));
        decrements.push(decrement('%Cover%', totalGarments));
        decrements.push(decrement('%Tag%', totalGarments));
        decrements.push(decrement('%Label%', totalGarments));
        decrements.push(decrement('%Packaging%', Math.ceil(totalGarments / 5))); // ~1 roll per 5 items

        // Wash consumables (liters per kg)
        if (washKg > 0) {
          decrements.push(decrement('%Detergent%', washKg * 0.15));      // ~150ml per kg
          decrements.push(decrement('%Fabric Softener%', washKg * 0.05)); // ~50ml per kg
        }

        // Dry clean consumables
        if (dryCleanPieces > 0) {
          decrements.push(decrement('%Dry Clean%Solvent%', dryCleanPieces * 0.3)); // ~300ml per piece
          decrements.push(decrement('%Stain Remover%', dryCleanPieces * 0.1));     // ~100ml per piece
        }

        await Promise.all(decrements);
      } catch (invErr) {
        console.error('[Inventory Auto-Decrement] Non-blocking error:', invErr.message);
      } finally {
        bgClient.release();
      }
    });

    // Insert payments (handles split / multiple initial payments)
    // body.payments should be an array like [{ method: 'cash', amount: 500, tendered: 600 }]
    const initialPayments = body.payments || [];
    let totalPaid = 0;
    
    let hasOnlinePayment = false;
    for (const p of initialPayments) {
      const pAmount = parseFloat(p.amount || 0);
      if (pAmount > 0) {
        const isOnline = p.method === 'online' || p.method === 'card';
        if (isOnline) {
          hasOnlinePayment = true;
          // Online payments are pending until Razorpay confirms via webhook
          await client.query(
            `INSERT INTO payments (order_id, amount, payment_method, payment_status, idempotency_key) VALUES ($1, $2, $3, 'pending', $4)`,
            [orderId, pAmount, 'online', idempotencyKey ? `${idempotencyKey}_online` : null]
          );
        } else {
          totalPaid += pAmount;
          await client.query(
            `INSERT INTO payments (order_id, amount, payment_method, payment_status, idempotency_key) VALUES ($1, $2, $3, 'completed', $4)`,
            [orderId, pAmount, p.method || 'cash', idempotencyKey ? `${idempotencyKey}_${p.method}` : null]
          );
        }
      }
    }

    // Update payment status based on total paid (online amounts not counted yet)
    let finalPaymentStatus = 'pending';
    if (!hasOnlinePayment && totalPaid >= totalAmount) {
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

    // Dispatch background tasks via Inngest
    after(async () => {
      try {
        await inngest.send({
          name: 'order/created',
          data: {
            orderId: orderId,
            orderNumber: orderNumber,
            customerEmail: body.customer_email || null, // Assuming customer_email is available in body
          },
        });
      } catch (err) {
        console.error('[Inngest] Failed to send order/created event:', err.message);
      }
    });

    const orderResult = await query(
      `SELECT o.*, c.name as customer_name 
       FROM orders o LEFT JOIN customers c ON o.customer_id = c.id 
       WHERE o.id = $1`,
      [orderId]
    );

    return NextResponse.json({ ...orderResult.rows[0], requires_online_payment: hasOnlinePayment }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
