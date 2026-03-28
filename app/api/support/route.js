import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await query(`
      SELECT * FROM support_tickets 
      ORDER BY 
        CASE status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'resolved' THEN 2 ELSE 3 END,
        created_at DESC
    `);
    return NextResponse.json(res.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { subject, description, priority } = body;

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO support_tickets (subject, description, priority) VALUES ($1, $2, $3) RETURNING *`,
      [subject, description || '', priority || 'medium']
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
