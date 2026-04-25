import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const storeId = auth.user.store_id;

    // Execute independent queries in parallel
    const [customersRes, pricingRes, discountsRes] = await Promise.all([
      // Optimized Customers query (from customers/route.js)
      query(`
        SELECT c.*, 
          COUNT(o.id) as order_count,
          COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) as total_spent
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id
        WHERE c.store_id = $1
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `, [storeId]),

      // Pricing Catalog
      query('SELECT * FROM pricing WHERE store_id = $1 ORDER BY garment_type, service_type', [storeId]),

      // Volume Discounts
      query('SELECT * FROM volume_discounts WHERE store_id = $1 AND is_active = TRUE ORDER BY min_quantity DESC', [storeId])
    ]);

    return NextResponse.json({
      customers: customersRes.rows,
      pricing: pricingRes.rows,
      discounts: discountsRes.rows
    });
  } catch (error) {
    console.error('[Bootstrap Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
