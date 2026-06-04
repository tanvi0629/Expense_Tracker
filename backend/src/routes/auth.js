// src/routes/auth.js
const router = require('express').Router()
const { verifyFirebaseToken } = require('../controllers/authController')

router.post('/verify', verifyFirebaseToken)

module.exports = router
