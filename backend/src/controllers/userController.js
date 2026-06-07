// backend/src/controllers/userController.js
const User = require('../models/User')

async function getMe(req, res, next) {
  try {
    res.json({ success: true, user: sanitize(req.user) })
  } catch (err) { next(err) }
}

async function updateMe(req, res, next) {
  try {
    const { name, monthly_budget, preferred_currency } = req.body
    const updated = await User.update(req.user.id, {
      name,
      monthlyBudget:      monthly_budget !== undefined ? parseFloat(monthly_budget) : undefined,
      preferredCurrency:  preferred_currency || undefined,
    })
    res.json({ success: true, user: sanitize(updated) })
  } catch (err) { next(err) }
}

function sanitize(user) {
  const { id, firebase_uid, name, email, phone_number, monthly_budget, preferred_currency, created_at } = user
  return { id, firebase_uid, name, email, phone_number, monthly_budget, preferred_currency, created_at }
}

module.exports = { getMe, updateMe }