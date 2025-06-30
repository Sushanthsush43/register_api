require('dotenv').config();
const express = require('express');
const multer = require('multer');
const admin = require('firebase-admin');
const sendOTPWhatsApp = require('./twilioService');

const app = express();
const upload = multer();

// Initialize Firebase Admin with better error handling
let firebaseInitialized = false;

try {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is missing');
  }

  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString()
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });

  firebaseInitialized = true;
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
  process.exit(1); // Exit if Firebase fails to initialize
}

// Registration endpoint
app.post('/register', upload.none(), async (req, res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({ 
      message: 'Server configuration error',
      error: 'Firebase not initialized'
    });
  }

  try {
    const { name, email, phone } = req.body;
    
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['name', 'email', 'phone']
      });
    }

    const db = admin.firestore();
    const userRef = await db.collection('users').add({ 
      name, 
      email, 
      phone,
      createdAt: admin.firestore.FieldValue.serverTimestamp() 
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await sendOTPWhatsApp(phone, otp);

    res.status(201).json({ 
      message: 'Registration successful',
      userId: userRef.id,
      otpSent: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: firebaseInitialized ? 'healthy' : 'degraded',
    firebase: firebaseInitialized ? 'connected' : 'disconnected'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
