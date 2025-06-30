const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const cors = require("cors");

// Initialize Firebase Admin with credentials from environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Registration Endpoint
app.post('/register', upload.none(), async (req, res) => {
  try {
    console.log('Request body:', req.body); // Log incoming request
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const db = admin.firestore();
    const docRef = await db.collection('users').add({ name, email, phone });
    console.log('Document written with ID: ', docRef.id);
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await sendOTPWhatsApp(phone, otp);
    res.status(200).json({ message: 'Registration successful', otp });
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      fullError: error
    });
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Login Endpoint (optional simulation)
app.post("/login", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await admin.auth().getUserByEmail(email);
    res.status(200).json({ message: "User exists", user });
  } catch (error) {
    console.error("🔥 Error during registration:", error);
    res.status(500).send({ message: "Server error", error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
