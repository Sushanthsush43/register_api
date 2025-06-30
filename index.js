require('dotenv').config();
const express = require('express');
const multer = require('multer');
const admin = require('firebase-admin');
const sendOTPWhatsApp = require('./twilioService');

// Initialize Express app
const app = express();
const upload = multer();

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString())
    ),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Registration endpoint
app.post('/register', upload.none(), async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['name', 'email', 'phone']
      });
    }

    // Save to Firestore
    const db = admin.firestore();
    const userRef = await db.collection('users').add({ 
      name, 
      email, 
      phone,
      createdAt: admin.firestore.FieldValue.serverTimestamp() 
    });

    // Generate and send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await sendOTPWhatsApp(phone, otp);

    // Success response
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
  res.status(200).json({ status: 'healthy' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});
