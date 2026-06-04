// src/controllers/userController.js
const User = require('../models/User')

async function getMe(req, res, next) {
  try {
    res.json({ success: true, user: sanitize(req.user) })
  } catch (err) {
    next(err)
  }
}

async function updateMe(req, res, next) {
  try {
    const { name, monthly_budget } = req.body
    const updated = await User.update(req.user.id, {
      name,
      monthlyBudget: monthly_budget !== undefined ? parseFloat(monthly_budget) : undefined,
    })
    res.json({ success: true, user: sanitize(updated) })
  } catch (err) {
    next(err)
  }
}

function sanitize(user) {
  const { id, firebase_uid, name, email, phone_number, monthly_budget, created_at } = user
  return { id, firebase_uid, name, email, phone_number, monthly_budget, created_at }
}

module.exports = { getMe, updateMe }
