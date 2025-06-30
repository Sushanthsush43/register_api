require('dotenv').config();
const express = require('express');
const multer = require('multer');
const admin = require('firebase-admin');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sendOTPWhatsApp = require('./twilioService');

const app = express();
const upload = multer();

// Security Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Firebase Initialization
try {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString()
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
  process.exit(1);
}

// Enhanced Registration Endpoint
app.post('/register', upload.none(), async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Input Validation
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['name', 'email', 'phone']
      });
    }

    // Firestore Operation
    const db = admin.firestore();
    const userRef = await db.collection('users').add({
      name,
      email,
      phone,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    });

    // OTP Generation and Sending
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await sendOTPWhatsApp(phone, `Your verification code is: ${otp}`);

    // Success Response (excluding sensitive info)
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      userId: userRef.id,
      otpSent: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enhanced Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    firebase: 'connected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Listening on port ${PORT}`);
});

// Error Handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});
