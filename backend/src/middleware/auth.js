// src/middleware/auth.js
const jwt = require('jsonwebtoken')
const User = require('../models/User')

/**
 * Verifies our own JWT (issued after Firebase token exchange).
 * Attaches req.user (DB user row) to the request.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' })
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.userId)
    if (!user) return res.status(401).json({ message: 'User not found' })
    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' })
    }
    return res.status(401).json({ message: 'Invalid token' })
  }
}

module.exports = { authenticate }
