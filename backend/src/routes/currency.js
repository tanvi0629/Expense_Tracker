// backend/src/routes/currency.js
const router = require('express').Router()
const { authenticate } = require('../middleware/auth')
const { CURRENCIES, getLiveRates } = require('../utils/currencyRates')

// Get list of supported currencies
router.get('/list', authenticate, (req, res) => {
  res.json({ success: true, currencies: CURRENCIES })
})

// Get live exchange rates
router.get('/rates/:base?', authenticate, async (req, res, next) => {
  try {
    const base = req.params.base?.toUpperCase() || 'INR'
    if (!CURRENCIES[base]) return res.status(400).json({ message: 'Unsupported currency' })
    const data = await getLiveRates(base)
    res.json({ success: true, ...data })
  } catch (err) { next(err) }
})

// Convert amount
router.post('/convert', authenticate, async (req, res, next) => {
  try {
    const { amount, from, to } = req.body
    if (!amount || !from || !to) return res.status(400).json({ message: 'amount, from, to are required' })
    const data = await getLiveRates(from.toUpperCase())
    const rate = data.rates[to.toUpperCase()]
    if (!rate) return res.status(400).json({ message: `Cannot convert to ${to}` })
    res.json({ success: true, from, to, amount, converted: parseFloat((amount * rate).toFixed(2)), rate })
  } catch (err) { next(err) }
})

module.exports = router
