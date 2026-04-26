import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const storeId = auth.user.store_id;

    // Execute independent queries in parallel
    const [pricingRes, discountsRes] = await Promise.all([
      // Pricing Catalog
      query('SELECT * FROM pricing WHERE store_id = $1 ORDER BY garment_type, service_type', [storeId]),

      // Volume Discounts
      query('SELECT * FROM volume_discounts WHERE store_id = $1 AND is_active = TRUE ORDER BY min_quantity DESC', [storeId])
    ]);

    return NextResponse.json({
      pricing: pricingRes.rows,
      discounts: discountsRes.rows
    });
  } catch (error) {
    console.error('[Bootstrap Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
