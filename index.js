const express = require("express");
const admin = require("firebase-admin");
const multer = require("multer");
const sendWhatsAppOTP = require("./twilioService");
require("dotenv").config();

const app = express();
const upload = multer();

// Load Firebase credentials from environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS || "{}");
if (!serviceAccount || Object.keys(serviceAccount).length === 0) {
  console.error("❌ FIREBASE_CREDENTIALS environment variable is missing or invalid");
  process.exit(1);
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
    process.exit(1);
  }
}

const db = admin.firestore();

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Register API
app.post("/register", upload.none(), async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const userRef = db.collection("users").doc(phone);
    const doc = await userRef.get();

    if (doc.exists) {
      return res.status(409).json({ message: "User already exists" });
    }

    const otp = generateOTP();

    await userRef.set({
      name,
      email,
      phone,
      otp,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await sendWhatsAppOTP(phone, otp); // Send OTP via WhatsApp

    res.status(200).json({
      message: "User registered successfully. OTP sent via WhatsApp.",
      otp, // Keep for testing only, remove in production
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Configure port for Render or local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
