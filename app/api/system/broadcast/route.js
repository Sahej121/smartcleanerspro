import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';

export async function POST(request) {
  try {
    const { message, severity = 'info' } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 1. Log as a system event (Global)
    await query(
      'INSERT INTO system_logs (event_type, description, severity) VALUES ($1, $2, $3)',
      ['BROADCAST', `Admin Broadcast: ${message}`, severity]
    );

    // 2. We could also insert into a separate 'announcements' table if we had one.
    // For now, let's just use system_logs which are already watched by stores.

    return NextResponse.json({ success: true, message: 'Broadcast sent successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
