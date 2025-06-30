const express = require('express');
const multer = require('multer');
const admin = require('firebase-admin');
const sendOTPWhatsApp = require('./twilioService');
const dotenv = require('dotenv');

require('dotenv').config(); // If using .env locally

const admin = require('firebase-admin');

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString()
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
// Load env vars from .env locally

const app = express();
const upload = multer();

try {
  const serviceAccountJSON = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString()
  );

  console.log("✅ Using Firebase service account:", serviceAccountJSON.client_email);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountJSON)
  });

  // Test Firestore access
  admin.firestore().listCollections().then(collections => {
    console.log("✅ Firestore accessible. Collections:", collections.map(c => c.id));
  }).catch(err => {
    console.error("❌ Firestore access failed:", err.message);
  });

} catch (err) {
  console.error("❌ Failed to load service account:", err.message);
}

app.post('/register', upload.none(), async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const db = admin.firestore();
    await db.collection('users').add({ name, email, phone });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await sendOTPWhatsApp(phone, otp);

    res.status(200).json({ message: 'Registration successful', otp });
  } catch (error) {
    console.error('❌ Error during registration:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
