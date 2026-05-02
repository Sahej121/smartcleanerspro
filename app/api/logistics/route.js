import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function GET(request) {
  // Allow drivers, staff, frontdesk, managers, owners
  const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff', 'driver']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    // For drivers, we only show tasks assigned to them OR unassigned tasks for their store.
    let logisticsFilter = '';
    if (auth.user.role === 'driver') {
      logisticsFilter = `AND (o.driver_id = ${auth.user.id} OR o.driver_id IS NULL) AND o.store_id = ${auth.user.store_id || 1}`;
    } else if (auth.user.role !== 'owner') {
      logisticsFilter = `AND o.store_id = ${auth.user.store_id || 1}`;
    }

    const { rows } = await query(`
      SELECT 
        o.id, 
        o.order_number, 
        o.pickup_status, 
        o.delivery_status, 
        o.pickup_date, 
        o.delivery_date, 
        o.logistics_notes,
        o.driver_id,
        o.signature_data,
        o.proof_photo_url,
        c.name as customer_name,
        c.phone as customer_phone,
        c.address as customer_address,
        c.lat,
        c.lng
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE (o.pickup_status IN ('pending', 'scheduled', 'in_transit')
         OR o.delivery_status IN ('pending', 'scheduled', 'in_transit'))
      ${logisticsFilter}
      ORDER BY 
        CASE 
          WHEN o.pickup_status IN ('in_transit') OR o.delivery_status IN ('in_transit') THEN 1
          WHEN o.pickup_status IN ('scheduled') OR o.delivery_status IN ('scheduled') THEN 2
          ELSE 3
        END,
        COALESCE(o.pickup_date, o.delivery_date) DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch logistics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
