import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    
    const cookieStore = await cookies();
    const token = cookieStore.get('cleanflow_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);

    // Only owners can change store status
    if (!payload || payload.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden. Owner access required.' }, { status: 403 });
    }

    if (!['active', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('UPDATE stores SET status = ? WHERE id = ?').run(status, id);

    return NextResponse.json({ success: true, status });

  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
