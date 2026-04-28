// This is a stub/mock for the Twilio Client
// In a real application, you would install the twilio package and use your credentials.
// const twilio = require('twilio');
// const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function sendWhatsAppMessage(to, message) {
  if (process.env.NODE_ENV === 'test' || !process.env.TWILIO_ACCOUNT_SID) {
    console.log(`\n========= [MOCK WHATSAPP OUTBOUND] =========`);
    console.log(`To: ${to}`);
    console.log(`Message: \n${message}`);
    console.log(`============================================\n`);
    return { success: true, mock: true };
  }

  /* 
  // Real implementation:
  return await client.messages.create({
    body: message,
    from: 'whatsapp:+14155238886', // Twilio Sandbox Number
    to: `whatsapp:${to}`
  });
  */
}
