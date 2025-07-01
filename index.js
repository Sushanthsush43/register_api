const express = require('express');
const multer = require('multer');
const admin = require('firebase-admin');

const app = express();
const upload = multer();

// Initialize Firebase with raw JSON string
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error.stack);
  process.exit(1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/register', upload.none(), async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      throw new Error('Missing required fields: name, email, or phone');
    }

    const db = admin.firestore();
    await db.collection('users').add({ name, email, phone });
    console.log('User data saved to Firestore');

    res.status(200).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Server running'));
