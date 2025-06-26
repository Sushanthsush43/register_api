const twilio = require("twilio");

const accountSid = "ACdb49678bb4747792d2eaced7c2a8853c";
const authToken = "bc987f24e911b6c12d515ec61b58aeeb";
const contentSid = "HXb5b62575e6e4ff6129ad7c8efe1f983e"; // Update with approved template SID

const client = twilio(accountSid, authToken);

function sendWhatsAppOTP(phone, otp) {
  return client.messages
    .create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:${phone}`,
      contentSid: contentSid,
      contentVariables: JSON.stringify({
        "1": otp,
        "2": "30 seconds",
      }),
    })
    .then((message) => {
      console.log("Message sent! SID:", message.sid);
      return message.sid; // Return SID for potential further use
    })
    .catch((error) => {
      console.error("❌ Error sending message:", error);
      throw error; // Propagate error for handling
    });
}

module.exports = { sendWhatsAppOTP };
