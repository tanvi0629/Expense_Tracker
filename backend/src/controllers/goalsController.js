const SavingsGoal = require('../models/SavingsGoal')

async function getGoals(req, res, next) {
  try {
    const goals = await SavingsGoal.findAllByUser(req.user.id)
    res.json({ success: true, goals })
  } catch (err) { next(err) }
}

async function createGoal(req, res, next) {
  try {
    const { title, targetAmount, currentAmount, emoji, color, deadline } = req.body
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' })
    if (!targetAmount || targetAmount <= 0) return res.status(400).json({ message: 'Target amount must be positive' })
    const goal = await SavingsGoal.create(req.user.id, { title, targetAmount, currentAmount, emoji, color, deadline })
    res.status(201).json({ success: true, goal })
  } catch (err) { next(err) }
}

async function updateGoal(req, res, next) {
  try {
    const goal = await SavingsGoal.update(parseInt(req.params.id), req.user.id, req.body)
    if (!goal) return res.status(404).json({ message: 'Goal not found' })
    res.json({ success: true, goal })
  } catch (err) { next(err) }
}

async function addAmount(req, res, next) {
  try {
    const { amount } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Amount must be positive' })
    const goal = await SavingsGoal.addAmount(parseInt(req.params.id), req.user.id, amount)
    if (!goal) return res.status(404).json({ message: 'Goal not found' })
    res.json({ success: true, goal })
  } catch (err) { next(err) }
}

async function deleteGoal(req, res, next) {
  try {
    const deleted = await SavingsGoal.delete(parseInt(req.params.id), req.user.id)
    if (!deleted) return res.status(404).json({ message: 'Goal not found' })
    res.json({ success: true })
  } catch (err) { next(err) }
}

module.exports = { getGoals, createGoal, updateGoal, addAmount, deleteGoal }
