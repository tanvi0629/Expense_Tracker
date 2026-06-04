// src/controllers/authController.js
const admin = require('../config/firebase')
const jwt   = require('jsonwebtoken')
const User  = require('../models/User')

/**
 * POST /api/auth/verify
 * Accepts a Firebase ID token, verifies it, upserts the user in Postgres,
 * and returns a signed JWT for subsequent API calls.
 */
async function verifyFirebaseToken(req, res, next) {
  try {
    const { idToken } = req.body
    if (!idToken) {
      return res.status(400).json({ message: 'idToken is required' })
    }

    // Verify with Firebase Admin SDK
    let decoded
    try {
      decoded = await admin.auth().verifyIdToken(idToken)
    } catch (err) {
      return res.status(401).json({ message: 'Invalid Firebase token', detail: err.message })
    }

    const { uid, name, email, phone_number: phoneNumber, picture } = decoded

    // Upsert user in Postgres
    const user = await User.upsert({
      firebaseUid: uid,
      name:        name || null,
      email:       email || null,
      phoneNumber: phoneNumber || null,
    })

    // Sign our own JWT
    const token = jwt.sign(
      { userId: user.id, firebaseUid: uid },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({ success: true, token, user: sanitizeUser(user) })
  } catch (err) {
    next(err)
  }
}

function sanitizeUser(user) {
  const { id, firebase_uid, name, email, phone_number, monthly_budget, created_at } = user
  return { id, firebase_uid, name, email, phone_number, monthly_budget, created_at }
}

module.exports = { verifyFirebaseToken }
