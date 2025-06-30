const express = require('express');
const admin = require('firebase-admin');
const sendOTPWhatsApp = require('./sendOTPWhatsApp');

const app = express();
const port = process.env.PORT || 3000;

console.log('Starting Firebase initialization...');
try {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountBase64) {
    console.error('FIREBASE_SERVICE_ACCOUNT environment variable is missing');
    throw new Error('Missing Firebase service account');
  }
  console.log('Decoding service account...');
  const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString());
  console.log('Service account decoded, initializing Firebase...');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error; // This will be caught by the route handler
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/register', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const db = admin.firestore();
    await db.collection('users').add({ name, email, phone });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await sendOTPWhatsApp(phone, otp);
    res.status(200).json({ message: 'Registration successful', otp });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
