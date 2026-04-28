import { query } from '@/lib/db/db';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const auth = await requireRole(request, ['owner', 'manager', 'frontdesk', 'staff', 'driver']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  try {
    const { type, status, notes, signature, photo, driverId } = await request.json();

    if (!['pickup', 'delivery'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const column = type === 'pickup' ? 'pickup_status' : 'delivery_status';
    
    await query(
      `UPDATE orders SET 
        ${column} = $1, 
        logistics_notes = $2,
        signature_data = COALESCE($3, signature_data),
        proof_photo_url = COALESCE($4, proof_photo_url),
        driver_id = COALESCE($5, driver_id),
        logistics_last_updated = NOW()
      WHERE id = $6`,
      [status, notes || null, signature || null, photo || null, driverId || null, id]
    );

    // Trigger WhatsApp Notifications
    try {
      const { rows } = await query(`
        SELECT c.phone, c.name, o.order_number 
        FROM orders o 
        JOIN customers c ON o.customer_id = c.id 
        WHERE o.id = $1
      `, [id]);
      
      if (rows.length > 0) {
        const { phone, name, order_number } = rows[0];
        const { sendWhatsAppMessage } = await import('@/lib/whatsapp/twilioClient');
        
        if (status === 'in_transit') {
          const msg = `Hi ${name}! Your order #${order_number} is out for delivery. Our driver is on the way!`;
          await sendWhatsAppMessage(phone, msg);
        } else if (status === 'completed' && type === 'delivery') {
          const msg = `Hi ${name}! Your order #${order_number} has been delivered. Thank you for choosing DrycleanersFlow!`;
          await sendWhatsAppMessage(phone, msg);
        }
      }
    } catch (waError) {
      console.error('WhatsApp trigger failed:', waError);
    }

    return NextResponse.json({ message: `${type} status updated to ${status}` });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
