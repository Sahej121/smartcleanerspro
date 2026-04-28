// Native fetch available in Node.js >= 18

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/whatsapp';
const MOCK_PHONE = 'whatsapp:+15551234567';

async function sendIncomingMessage(body, mediaUrl = null) {
  const payload = {
    From: MOCK_PHONE,
    Body: body,
  };
  
  if (mediaUrl) {
    payload.MediaUrl0 = mediaUrl;
  }

  console.log(`\n\x1b[36m[STAFF -> BOT]\x1b[0m ${mediaUrl ? '(Image Attached) ' : ''}${body}`);
  
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.status === 200) {
      // The mock client logger already prints the reply, so we just await the OK.
      await new Promise(r => setTimeout(r, 500)); // Small delay for logs to flush
    } else {
      console.error('Webhook Error:', res.status, await res.text());
    }
  } catch (e) {
    console.error('Error hitting webhook:', e.message);
  }
}

async function runSimulation() {
  console.log('--- STARTING WHATSAPP SIMULATION ---');
  
  await sendIncomingMessage('Hi'); // Trigger Initial flow
  await new Promise(r => setTimeout(r, 1000));
  
  await sendIncomingMessage('1234'); // Valid PIN
  await new Promise(r => setTimeout(r, 1000));
  
  await sendIncomingMessage('9811001001'); // Existing customer (Arjun Mehta)
  await new Promise(r => setTimeout(r, 1000));
  
  await sendIncomingMessage('Shirt', 'https://example.com/mock-shirt.jpg'); // Media 1
  await new Promise(r => setTimeout(r, 1000));
  
  await sendIncomingMessage('Trouser', 'https://example.com/mock-trousers.jpg'); // Media 2
  await new Promise(r => setTimeout(r, 1000));
  
  await sendIncomingMessage('DONE'); // Finish garments
  await new Promise(r => setTimeout(r, 1000));
  
  await sendIncomingMessage('YES'); // Confirm
  
  console.log('--- SIMULATION COMPLETE ---');
}

runSimulation();
