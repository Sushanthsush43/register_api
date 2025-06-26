const twilio = require('twilio');
require('dotenv').config();


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function sendOTPWhatsApp(to, otp) {
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_FROM,
      contentSid: process.env.TWILIO_TEMPLATE_SID,
      contentVariables: JSON.stringify({
        "1": otp,
        "2": "5 minutes"
      }),
      to: `whatsapp:${to}`
    });

    console.log('Message sent! SID:', message.sid);
  } catch (error) {
    console.error('Error sending OTP via WhatsApp:', error);
  }
}

module.exports = sendOTPWhatsApp;
