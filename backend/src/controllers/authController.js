// src/controllers/authController.js
const admin = require("../config/firebase");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * POST /api/auth/verify
 * Accepts a Firebase ID token, verifies it, upserts the user in Postgres,
 * and returns a signed JWT for subsequent API calls.
 */

async function verifyFirebaseToken(req, res, next) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "idToken is required" });
    }

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      console.error("Firebase verify error:", err.message); // ← ADD THIS
      return res
        .status(401)
        .json({ message: "Invalid Firebase token", detail: err.message });
    }

    const { uid, name, email, phone_number: phoneNumber } = decoded;

    try {
      const user = await User.upsert({
        firebaseUid: uid,
        name: name || null,
        email: email || null,
        phoneNumber: phoneNumber || null,
      });

      const token = jwt.sign(
        { userId: user.id, firebaseUid: uid },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
      );

      res.json({ success: true, token, user: sanitizeUser(user) });
    } catch (err) {
      console.error("DB upsert error:", err.message); // ← ADD THIS
      next(err);
    }
  } catch (err) {
    console.error("Auth verify error:", err.message); // ← ADD THIS
    next(err);
  }
}

function sanitizeUser(user) {
  const {
    id,
    firebase_uid,
    name,
    email,
    phone_number,
    monthly_budget,
    created_at,
  } = user;
  return {
    id,
    firebase_uid,
    name,
    email,
    phone_number,
    monthly_budget,
    created_at,
  };
}

module.exports = { verifyFirebaseToken };
