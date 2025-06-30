require('dotenv').config();
const express = require('express');
const multer = require('multer');
const admin = require('firebase-admin');
const sendOTPWhatsApp = require('./twilioService');

const app = express();
const upload = multer();

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString()))
});

app.post('/register', upload.none(), async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    // Save to Firestore
    const db = admin.firestore();
    await db.collection('users').add({ name, email, phone });
    // Send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await sendOTPWhatsApp(phone, otp);
    res.status(200).json({ message: 'Registration successful', otp });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Server running'));