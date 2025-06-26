const express = require("express");
const admin = require("firebase-admin");
const multer = require("multer");
const sendWhatsAppOTP = require("./twilioService");
require('dotenv').config();

const app = express();
const upload = multer();
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

    await sendWhatsAppOTP(phone, otp); // ← Send OTP here

    res.status(200).json({
      message: "User registered successfully. OTP sent via WhatsApp.",
      otp, // keep for testing only
    });
} catch (error) {
  console.error("❌ Registration error:", error);
  res.status(500).json({ message: "Server error", error: error.message });
}

});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
