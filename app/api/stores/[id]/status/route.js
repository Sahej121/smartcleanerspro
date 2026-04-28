import { NextResponse } from 'next/server';
import { query, logSystemEvent } from '@/lib/db/db';
import { requireRole } from '@/lib/auth';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    const auth = await requireRole(req, ['owner']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!['active', 'suspended', 'idle'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }

    // Get store name for logging
    const storeRes = await query('SELECT store_name FROM stores WHERE id = $1', [id]);
    const storeName = storeRes.rows[0]?.store_name || `Store #${id}`;

    await query('UPDATE stores SET status = $1 WHERE id = $2', [status, id]);

    // Log the event
    await logSystemEvent(
      'SERVICE_CONTROL',
      `Store '${storeName}' status changed to ${status.toUpperCase()} by Administrator`,
      status === 'suspended' ? 'warning' : 'info',
      id
    );

    return NextResponse.json({ success: true, status });

  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
