// // twilioService.js
// const twilio = require('twilio');

// const accountSid = 'ACdb49678bb4747792d2eaced7c2a8853c';
// const authToken = 'bc987f24e911b6c12d515ec61b58aeeb';
// const client = twilio(accountSid, authToken);

// const contentSid = 'HXb5b62575e6e4ff6129ad7c8efe1f983e'; 

// async function sendWhatsAppOTP(phone, otp) {
//   try {
//     const response = await client.messages.create({
//       from: 'whatsapp:+14155238886',
//       to: `whatsapp:${phone}`,
//       contentSid: contentSid,
//       contentVariables: JSON.stringify({
//         "1": otp,
//         "2": "5 minutes"
//       }),
//     });
//     console.log("✅ OTP sent! SID:", response.sid);
//   } catch (error) {
//     console.error("❌ WhatsApp OTP send failed:", error);
//   }
// }

// module.exports = sendWhatsAppOTP;
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

async function sendOTPWhatsApp(to, otp) {
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER, // 'whatsapp:+14155238886'
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
