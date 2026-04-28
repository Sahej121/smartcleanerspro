import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { transaction } from '@/lib/db/db';
import { reconcileStoreLimits } from '@/lib/tier-enforcement';

export async function PATCH(req, { params }) {
  try {
    const auth = await requireRole(req, ['owner']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const payload = auth.user;

    const { id } = await params;
    const body = await req.json();
    const { tier, payment_confirmed } = body;

    const validTiers = ['software_only', 'hardware_bundle', 'enterprise'];
    if (!tier || !validTiers.includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier. Must be software_only, hardware_bundle, or enterprise.' }, { status: 400 });
    }

    const isSuperadmin = payload.role === 'superadmin';

    // If regular owner, demand "payment"
    if (!isSuperadmin && !payment_confirmed) {
      return NextResponse.json({ error: 'Payment required for subscription upgrade.' }, { status: 402 });
    }

    // Use a transaction to update the tier and reconcile limits
    const stats = await transaction(async (q) => {
      // 1. Verify access
      let storeCheck;
      if (isSuperadmin) {
        storeCheck = await q('SELECT owner_id FROM stores WHERE id = $1', [id]);
      } else {
        storeCheck = await q('SELECT owner_id FROM stores WHERE id = $1 AND owner_id = $2', [id, payload.id]);
      }

      if (storeCheck.rows.length === 0) {
        throw new Error('NOT_FOUND');
      }

      const targetOwnerId = storeCheck.rows[0].owner_id;

      // 2. Perform reconciliation (this updates ALL stores for this owner to the new tier)
      return await reconcileStoreLimits({ query: q }, targetOwnerId, tier);
    });

    return NextResponse.json({ 
      success: true, 
      store_id: id, 
      tier,
      reconciliation: stats
    });

  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Store not found or access denied.' }, { status: 404 });
    }
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
