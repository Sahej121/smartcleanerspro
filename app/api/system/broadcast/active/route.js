import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';

export async function GET(req) {
  try {
    // Fetch recent broadcasts from the last 24 hours
    const res = await query(`
      SELECT * FROM system_logs 
      WHERE event_type = 'BROADCAST' 
        AND created_at >= NOW() - INTERVAL '24 HOURS'
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (res.rows.length === 0) {
      return NextResponse.json(null);
    }
    return NextResponse.json(res.rows[0]);
  } catch (err) {
    console.error('Failed to fetch active broadcast:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
