import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';
import { sendWhatsAppMessage } from '@/lib/whatsapp/twilioClient';
import { verifyPassword } from '@/lib/auth';

function generateOrderNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'WA-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

export async function POST(req) {
  try {
    // Twilio webhooks can come as form-urlencoded, but our mock sends JSON.
    const contentType = req.headers.get('content-type') || '';
    
    let body;
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      body = Object.fromEntries(formData);
    }

    const { Body, From, MediaUrl0 } = body;
    const incomingText = Body ? Body.trim() : '';
    const phone = From ? From.replace('whatsapp:', '') : null;
    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : null;

    if (!phone) {
      return NextResponse.json({ error: 'Missing From number' }, { status: 400 });
    }

    // Lookup session
    let sessionRes = await query('SELECT * FROM whatsapp_sessions WHERE phone_number = $1', [phone]);
    let session = sessionRes.rows[0];

    let nextState = session?.state;
    let context = session?.context || {};
    let replyMsg = '';

    // If user types 'CANCEL' or 'RESET' at any point, restart flow.
    if (incomingText.toUpperCase() === 'RESET') {
      await query('UPDATE whatsapp_sessions SET state = $1, context = $2 WHERE phone_number = $3', ['REQUIRE_CUSTOMER', '{}', phone]);
      await sendWhatsAppMessage(From, 'Flow reset. Please provide a Customer Phone Number to start a new order.');
      return NextResponse.json({ success: true });
    }

    // If no session exists, check if this is a registered staff member
    if (!session) {
      const staffCheck = await query(`
        SELECT id, name, store_id FROM users 
        WHERE phone LIKE $1 AND role IN ('staff', 'driver', 'manager', 'frontdesk', 'owner')
      `, [`%${cleanPhone}`]);

      if (staffCheck.rows.length > 0) {
        const staff = staffCheck.rows[0];
        await query('INSERT INTO whatsapp_sessions (phone_number, user_id, store_id, state) VALUES ($1, $2, $3, $4)', 
          [phone, staff.id, staff.store_id, 'REQUIRE_PIN']);
        session = { phone_number: phone, user_id: staff.id, store_id: staff.store_id, state: 'REQUIRE_PIN', context: {} };
        await sendWhatsAppMessage(From, `Welcome back, ${staff.name}! 👔\n\nPlease reply with your 4-digit PIN to authenticate.`);
      } else {
        // Not a registered staff member, handle as potential new customer or ignore
        await query('INSERT INTO whatsapp_sessions (phone_number) VALUES ($1)', [phone]);
        await sendWhatsAppMessage(From, 'Welcome to DrycleanersFlow! 👔\n\nYou are not registered as a staff member. If you are an employee, please contact your admin to register your mobile number.');
      }
      return NextResponse.json({ success: true });
    }

    // STATE MACHINE
    switch (session.state) {
      case 'REQUIRE_PIN':
        const pinText = incomingText;
        if (pinText.length !== 4) {
          replyMsg = 'Invalid PIN. Please send exactly 4 digits.';
          break;
        }

        const userAuthRes = await query(`
          SELECT id, name, pin_hash, store_id 
          FROM users 
          WHERE id = $1
        `, [session.user_id]);
        
        const staffMember = userAuthRes.rows[0];
        let isValid = false;

        if (staffMember) {
          if (staffMember.pin_hash) {
            isValid = await verifyPassword(pinText, staffMember.pin_hash);
          } else if (pinText === '1234') { // Fallback for dev/mock
            isValid = true;
          }
        }

        if (isValid) {
          nextState = 'REQUIRE_CUSTOMER';
          context = { garments: [] };
          replyMsg = `Authentication successful. Welcome, ${staffMember.name}!\n\nPlease enter the Customer's 10-digit Phone Number to begin collecting garments.`;
        } else {
          replyMsg = 'Authentication failed. Incorrect PIN. Please try again.';
        }
        break;

      case 'REQUIRE_CUSTOMER':
        // Look up customer phone
        const custPhone = incomingText.replace(/\D/g, '');
        if (incomingText.toUpperCase().startsWith('NAME:')) {
          // Create new customer
          const newName = incomingText.substring(5).trim();
          const p = context.failed_phone || '+91' + Math.floor(Math.random() * 10000000000);
          const newCust = await query('INSERT INTO customers (name, phone) VALUES ($1, $2) RETURNING id, name', [newName, p]);
          context.customer_id = newCust.rows[0].id;
          context.customer_name = newCust.rows[0].name;
          nextState = 'COLLECTING_GARMENTS';
          replyMsg = `Customer ${newName} created!\n\nPlease send garment photos now. Send 'DONE' when finished.`;
        } else if (custPhone.length >= 10) {
          // Naive matching ending with the digits
          const custRes = await query('SELECT id, name FROM customers WHERE phone LIKE $1', [`%${custPhone.slice(-10)}%`]);
          if (custRes.rows.length > 0) {
            context.customer_id = custRes.rows[0].id;
            context.customer_name = custRes.rows[0].name;
            nextState = 'COLLECTING_GARMENTS';
            replyMsg = `Found customer: ${context.customer_name}.\n\nPlease send garment photos now. Send 'DONE' when finished.`;
          } else {
            context.failed_phone = custPhone;
            replyMsg = `Customer not found. Please reply with "NAME: Their Name" to create a new profile.`;
          }
        } else {
          replyMsg = `Please send a valid phone number.`;
        }
        break;

      case 'COLLECTING_GARMENTS':
        const upperText = incomingText.toUpperCase();
        if (upperText.startsWith('DONE')) {
          if (!context.garments || context.garments.length === 0) {
            replyMsg = 'You haven\'t uploaded any photos. Send photos or type RESET to cancel.';
          } else {
            // Extract bag number if provided: DONE B101
            const parts = incomingText.split(/\s+/);
            if (parts.length > 1) {
              context.bag_number = parts.slice(1).join(' ');
            } else {
              context.bag_number = 'B-TBD'; // To Be Determined
            }

            nextState = 'CONFIRMING';
            const garmentList = context.garments.map((g, i) => `${i+1}. ${g.type}`).join('\n');
            replyMsg = `📋 *Order Summary*\n\n` +
                       `👤 Customer: ${context.customer_name}\n` +
                       `🛍️ Bag Number: ${context.bag_number}\n` +
                       `👕 Items (${context.garments.length}):\n${garmentList}\n\n` +
                       `This will be created as an *Open Ticket*. Reply *'YES'* to confirm processing.`;
          }
        } else if (MediaUrl0) {
          if (!context.garments) context.garments = [];
          // Capture the body text as the garment type if provided, otherwise default to 'Open Ticket'
          const garmentType = incomingText || 'Open Ticket';
          context.garments.push({ url: MediaUrl0, type: garmentType });
          replyMsg = `✅ Received ${garmentType} (${context.garments.length}). Send the next photo or type 'DONE'.`;
        } else {
          replyMsg = `Please send an image attachment of the garment, or type 'DONE' to proceed.`;
        }
        break;

      case 'CONFIRMING':
        if (incomingText.toUpperCase() === 'YES') {
          // Execute order creation
          const orderNum = generateOrderNumber();
          const storeId = session.store_id || 1;
          
          const orderRes = await query(
            `INSERT INTO orders (order_number, customer_id, store_id, status, total_amount, payment_status, created_at) 
             VALUES ($1, $2, $3, 'received', 0, 'pending', NOW()) RETURNING id`,
            [orderNum, context.customer_id, storeId]
          );
          const orderId = orderRes.rows[0].id;

          for (let i = 0; i < context.garments.length; i++) {
            const garment = context.garments[i];
            const gType = garment.type || 'Open Ticket';
            const bagPrefix = context.bag_number || 'B1';
            const tagId = `${bagPrefix}-${orderNum}-${gType.replace(/\s+/g, '')}-${i + 1}`;

            const itemRes = await query(
              `INSERT INTO order_items (order_id, garment_type, service_type, quantity, price, status, image_url, tag_id, bag_id) 
               VALUES ($1, $2, 'To be priced', 1, 0, 'received', $3, $4, $5) RETURNING id`,
              [orderId, gType, garment.url, tagId, bagPrefix]
            );
            await query(
              `INSERT INTO garment_workflow (order_item_id, stage, updated_by, timestamp) VALUES ($1, 'received', $2, NOW())`,
              [itemRes.rows[0].id, session.user_id]
            );
          }

          nextState = 'REQUIRE_CUSTOMER';
          context = {}; // Clear context for next order
          replyMsg = `🎉 Order created successfully!\n\nOrder Number: ${orderNum}\n\nGarments have been logged with QR tags for the front desk to print. You may collect the garments. \n\n(Send next customer's phone number to start a new order)`;

        } else {
          replyMsg = `Confirmation pending. Reply 'YES' to create order or 'RESET' to cancel everything.`;
        }
        break;

      default:
        // Recovery
        nextState = 'REQUIRE_CUSTOMER';
        context = {};
        replyMsg = 'System recovering. Please enter the Customer Phone Number to begin.';
    }

    // Update session state
    await query('UPDATE whatsapp_sessions SET state = $1, context = $2, updated_at = NOW() WHERE phone_number = $3', [nextState, JSON.stringify(context), phone]);

    // Dispatch reply
    if (replyMsg) {
      await sendWhatsAppMessage(From, replyMsg);
    }

    // Twilio requires a 200 OK response with TwiML, but returning simple JSON is fine if we use REST client. Let's return TwiML for true Twilio compatibility.
    // If it's returning empty, Twilio doesn't reply. 
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('WhatsApp Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
