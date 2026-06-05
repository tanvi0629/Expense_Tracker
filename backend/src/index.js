// src/index.js
require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const rateLimit  = require('express-rate-limit')

const authRoutes    = require('./routes/auth')
const userRoutes    = require('./routes/users')
const expenseRoutes = require('./routes/expenses')
const incomeRoutes  = require('./routes/incomes')
const recurringRoutes = require('./routes/recurring')
const currencyRoutes  = require('./routes/currency')
const errorHandler  = require('./middleware/errorHandler')

// Validate required env vars
const required = ['FIREBASE_PROJECT_ID','FIREBASE_CLIENT_EMAIL','FIREBASE_PRIVATE_KEY','JWT_SECRET']
const missing  = required.filter(k => !process.env[k])
if (missing.length) {
  console.error('❌ Missing required env vars:', missing.join(', '))
  process.exit(1)
}

const app  = express()
const PORT = process.env.PORT || 5000

// ── Security & logging ──────────────────────────────────────
app.use(helmet())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ── CORS ────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
]
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true)
    cb(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
}))

// ── Rate limiting ────────────────────────────────────────────
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many auth requests' }))
app.use('/api',      rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }))

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Routes ───────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.use('/api/auth',     authRoutes)
app.use('/api/users',    userRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/incomes',  incomeRoutes)
app.use('/api/recurring', recurringRoutes)
app.use('/api/currency',  currencyRoutes)

// 404
app.use((req, res) => res.status(404).json({ message: `Route ${req.method} ${req.path} not found` }))

// Global error handler
app.use(errorHandler)

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`)
})

module.exports = app
