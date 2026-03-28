import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function PATCH(req, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('cleanflow_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden. Owner access required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { tier } = body;

    const validTiers = ['starter', 'growth', 'pro'];
    if (!tier || !validTiers.includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier. Must be starter, growth, or pro.' }, { status: 400 });
    }

    // Verify the store belongs to this owner
    const storeRes = await query('SELECT * FROM stores WHERE id = $1 AND owner_id = $2', [id, payload.id]);
    if (storeRes.rows.length === 0) {
      return NextResponse.json({ error: 'Store not found or access denied.' }, { status: 404 });
    }

    await query('UPDATE stores SET subscription_tier = $1 WHERE id = $2', [tier, id]);

    return NextResponse.json({ success: true, store_id: id, tier });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
