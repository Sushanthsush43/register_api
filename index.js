require('dotenv').config();
const express = require('express');
const multer = require('multer');
const admin = require('firebase-admin');

const app = express();
const upload = multer();

// Enhanced Firebase initialization
const initializeFirebase = () => {
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable');
    }

    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString()
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://your-project.firebaseio.com'
    });

    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Firebase initialization failed:', error.message);
    console.error('Please check:');
    console.error('1. FIREBASE_SERVICE_ACCOUNT is set in environment variables');
    console.error('2. The value is a valid base64 encoded service account JSON');
    return false;
  }
};

if (!initializeFirebase()) {
  process.exit(1); // Exit if Firebase fails to initialize
}

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    firebase: admin.apps.length > 0 ? 'connected' : 'disconnected'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Required environment variables:');
  console.log('- FIREBASE_SERVICE_ACCOUNT');
  console.log('- FIREBASE_DATABASE_URL');
});
