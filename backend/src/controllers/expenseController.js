// src/controllers/expenseController.js
const Expense = require('../models/Expense')
const { Parser } = require('json2csv')

async function getExpenses(req, res, next) {
  try {
    const { search, category, start_date, end_date, limit, offset } = req.query
    const result = await Expense.findAllByUser(req.user.id, {
      search, category, startDate: start_date, endDate: end_date,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    })
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
}

async function createExpense(req, res, next) {
  try {
    const { title, amount, category, date, notes } = req.body
    if (!title?.trim())    return res.status(400).json({ message: 'Title is required' })
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Amount must be positive' })
    if (!date)             return res.status(400).json({ message: 'Date is required' })

    const expense = await Expense.create(req.user.id, { title, amount, category, date, notes })
    res.status(201).json({ success: true, expense })
  } catch (err) {
    next(err)
  }
}

async function updateExpense(req, res, next) {
  try {
    const { id } = req.params
    const expense = await Expense.update(parseInt(id), req.user.id, req.body)
    if (!expense) return res.status(404).json({ message: 'Expense not found' })
    res.json({ success: true, expense })
  } catch (err) {
    next(err)
  }
}

async function deleteExpense(req, res, next) {
  try {
    const { id } = req.params
    const deleted = await Expense.delete(parseInt(id), req.user.id)
    if (!deleted) return res.status(404).json({ message: 'Expense not found' })
    res.json({ success: true, message: 'Expense deleted' })
  } catch (err) {
    next(err)
  }
}

async function exportCSV(req, res, next) {
  try {
    const rows = await Expense.getAllForExport(req.user.id)
    const fields = [
      { label: 'Title',      value: 'title' },
      { label: 'Amount',     value: 'amount' },
      { label: 'Category',   value: 'category' },
      { label: 'Date',       value: 'date' },
      { label: 'Notes',      value: 'notes' },
      { label: 'Created At', value: 'created_at' },
    ]
    const parser = new Parser({ fields })
    const csv    = parser.parse(rows)

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="expenses-${Date.now()}.csv"`)
    res.send(csv)
  } catch (err) {
    next(err)
  }
}

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense, exportCSV }
