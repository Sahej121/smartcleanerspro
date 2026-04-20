import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';

export async function POST(req) {
  try {
    const { name, email, storeName, volume, message } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Insert into the leads table we created
    await query(
      `INSERT INTO leads (name, email, store_name, volume, message) 
       VALUES ($1, $2, $3, $4, $5)`,
      [name, email, storeName, volume, message]
    );

    console.log(`[LeadCapture] New enterprise lead from ${email}`);

    // Since we don't have an email API, we successfully return after saving to DB.
    // The user can check the database for leads.
    
    return NextResponse.json({ 
      success: true, 
      message: 'Lead captured successfully' 
    });

  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json({ error: 'Failed to process inquiry' }, { status: 500 });
  }
}
