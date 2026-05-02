import { sendWhatsAppMessage } from './whatsapp/twilioClient';
import { sendEmail } from './email';
import { query } from './db/db';

export async function triggerStatusNotification(orderId, newStatus) {
  try {
    // 1. Fetch order and customer details
    const res = await query(`
      SELECT o.order_number, c.name, c.phone, c.email, s.store_name, s.phone as store_phone
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      JOIN stores s ON o.store_id = s.id
      WHERE o.id = $1
    `, [orderId]);

    if (res.rows.length === 0) return;

    const { order_number, name, phone, email, store_name, store_phone } = res.rows[0];

    // 2. Prepare message templates
    const templates = {
      'processing': `Hi ${name}, your order #${order_number} is now being processed at ${store_name}. We'll notify you when it's ready!`,
      'ready': `Good news ${name}! Your order #${order_number} is ready for pickup/delivery at ${store_name}.`,
      'delivered': `Hi ${name}, your order #${order_number} from ${store_name} has been delivered. Thank you for choosing us!`,
      'cancelled': `Hi ${name}, your order #${order_number} has been cancelled. Please contact ${store_phone} for more details.`
    };

    const message = templates[newStatus];
    if (!message) return;

    console.log(`[Notification Gateway] Triggering ${newStatus} update for #${order_number}`);

    // 3. Send via WhatsApp (if phone exists)
    if (phone) {
      try {
        await sendWhatsAppMessage(phone, message);
      } catch (e) {
        console.error(`[Notification Gateway] WhatsApp failed for ${phone}:`, e.message);
      }
    }

    // 4. Send via Email (if email exists)
    if (email) {
      try {
        await sendEmail({
          to: email,
          subject: `Order Update: #${order_number} - ${newStatus.toUpperCase()}`,
          text: message,
          html: `<div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #10b981;">Order Update</h2>
            <p>${message}</p>
            <hr style="border: 1px solid #eee;" />
            <p style="font-size: 12px; color: #666;">${store_name} | ${store_phone}</p>
          </div>`
        });
      } catch (e) {
        console.error(`[Notification Gateway] Email failed for ${email}:`, e.message);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('[Notification Gateway] Error:', error);
    return { success: false, error: error.message };
  }
}
