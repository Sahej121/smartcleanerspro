import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('cleanflow_session')?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // If owner/manager, they might want all tasks? 
    // For now, just return tasks for the current user for the dashboard
    const res = await query(
      'SELECT * FROM staff_tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    );
    return NextResponse.json(res.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, is_completed } = await req.json();
    await query(
      'UPDATE staff_tasks SET is_completed = $1 WHERE id = $2 AND user_id = $3',
      [is_completed, id, user.id]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
