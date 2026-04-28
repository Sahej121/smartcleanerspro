import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db/db';

export async function POST(request) {
  try {
    const auth = await requireRole(request, ['owner']);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    if (auth.user.id !== 1) {
      return NextResponse.json({ error: 'Forbidden. Root owner access required.' }, { status: 403 });
    }

    const { message, severity = 'info' } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 1. Log as a system event (Global)
    await query(
      'INSERT INTO system_logs (event_type, description, severity) VALUES ($1, $2, $3)',
      ['BROADCAST', `Admin Broadcast: ${message}`, severity]
    );

    return NextResponse.json({ success: true, message: 'Broadcast sent successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
