import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const res = await query('SELECT * FROM pricing WHERE store_id = $1 ORDER BY garment_type, service_type', [auth.user.store_id]);
    
    return NextResponse.json(res.rows, {
      headers: {
        'Cache-Control': 'private, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { garment_type, service_type, price } = body;

    const res = await query(
      'INSERT INTO pricing (garment_type, service_type, price, store_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [garment_type, service_type, price, auth.user.store_id]
    );
    
    // Invalidate bootstrap cache
    invalidateCache(`bootstrap_${auth.user.store_id}`);
    
    return NextResponse.json(res.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id, price, garment_type, service_type } = body;

    if (garment_type && service_type) {
      await query(
        'UPDATE pricing SET price = $1, garment_type = $2, service_type = $3 WHERE id = $4 AND store_id = $5',
        [price, garment_type, service_type, id, auth.user.store_id]
      );
    } else {
      await query('UPDATE pricing SET price = $1 WHERE id = $2 AND store_id = $3', [price, id, auth.user.store_id]);
    }
    
    // Invalidate bootstrap cache
    invalidateCache(`bootstrap_${auth.user.store_id}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await query('DELETE FROM pricing WHERE id = $1 AND store_id = $2', [id, auth.user.store_id]);
    
    // Invalidate bootstrap cache
    invalidateCache(`bootstrap_${auth.user.store_id}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
