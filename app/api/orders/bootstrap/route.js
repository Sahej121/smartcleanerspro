import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getCachedData } from '@/lib/cache';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const storeId = auth.user.store_id;

    // Use server-side cache for pricing and discounts (5 min TTL)
    const bootstrapData = await getCachedData(
      `bootstrap_${storeId}`,
      async () => {
        const [pricingRes, discountsRes] = await Promise.all([
          query('SELECT * FROM pricing WHERE store_id = $1 ORDER BY garment_type, service_type', [storeId]),
          query('SELECT * FROM volume_discounts WHERE store_id = $1 AND is_active = TRUE ORDER BY min_quantity DESC', [storeId])
        ]);
        return {
          pricing: pricingRes.rows,
          discounts: discountsRes.rows
        };
      },
      300000 // 5 minutes
    );

    return NextResponse.json(bootstrapData);
  } catch (error) {
    console.error('[Bootstrap Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
