import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';
import { requireRole } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const user = auth.user;

    let res;
    if (user.role === 'owner' || user.role === 'manager') {
      res = await query(
        'SELECT t.*, u.name as assignee_name FROM staff_tasks t LEFT JOIN users u ON t.user_id = u.id WHERE t.store_id = $1 ORDER BY t.created_at DESC',
        [user.store_id]
      );
    } else {
      res = await query(
        'SELECT * FROM staff_tasks WHERE user_id = $1 ORDER BY created_at DESC',
        [user.id]
      );
    }
    return NextResponse.json(res.rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const user = auth.user;

    const { id, is_completed } = await request.json();
    if (user.role === 'owner' || user.role === 'manager') {
      await query(
        'UPDATE staff_tasks SET is_completed = $1 WHERE id = $2 AND store_id = $3',
        [is_completed, id, user.store_id]
      );
    } else {
      await query(
        'UPDATE staff_tasks SET is_completed = $1 WHERE id = $2 AND user_id = $3',
        [is_completed, id, user.id]
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
