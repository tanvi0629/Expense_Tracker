// backend/src/controllers/incomeController.js
const Income = require('../models/Income')

async function getIncomes(req, res, next) {
  try {
    const { start_date, end_date, limit, offset } = req.query
    const result = await Income.findAllByUser(req.user.id, {
      startDate: start_date,
      endDate: end_date,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    })
    res.json({ success: true, ...result })
  } catch (err) { next(err) }
}

async function createIncome(req, res, next) {
  try {
    const { title, amount, category, date, notes } = req.body
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' })
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Amount must be positive' })
    if (!date) return res.status(400).json({ message: 'Date is required' })

    const income = await Income.create(req.user.id, { title, amount, category, date, notes })
    res.status(201).json({ success: true, income })
  } catch (err) { next(err) }
}

async function updateIncome(req, res, next) {
  try {
    const income = await Income.update(parseInt(req.params.id), req.user.id, req.body)
    if (!income) return res.status(404).json({ message: 'Income not found' })
    res.json({ success: true, income })
  } catch (err) { next(err) }
}

async function deleteIncome(req, res, next) {
  try {
    const deleted = await Income.delete(parseInt(req.params.id), req.user.id)
    if (!deleted) return res.status(404).json({ message: 'Income not found' })
    res.json({ success: true, message: 'Income deleted' })
  } catch (err) { next(err) }
}

module.exports = { getIncomes, createIncome, updateIncome, deleteIncome }