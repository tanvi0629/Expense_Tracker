// backend/src/controllers/recurringController.js
const RecurringExpense = require('../models/RecurringExpense')
const Expense = require('../models/Expense')

async function getRecurring(req, res, next) {
  try {
    const items = await RecurringExpense.findAllByUser(req.user.id)
    res.json({ success: true, recurring: items })
  } catch (err) { next(err) }
}

async function createRecurring(req, res, next) {
  try {
    console.log('CREATE RECURRING BODY:', req.body)
    const { title, amount, category, frequency, startDate, notes } = req.body
    if (!title?.trim())           return res.status(400).json({ message: 'Title is required' })
    if (!amount || amount <= 0)   return res.status(400).json({ message: 'Amount must be positive' })
    if (!startDate)               return res.status(400).json({ message: 'Start date is required' })
    const item = await RecurringExpense.create(req.user.id, { title, amount, category, frequency, startDate, notes })
    res.status(201).json({ success: true, recurring: item })
  } catch (err) { next(err) }
}

async function updateRecurring(req, res, next) {
  try {
    const item = await RecurringExpense.update(parseInt(req.params.id), req.user.id, req.body)
    if (!item) return res.status(404).json({ message: 'Recurring expense not found' })
    res.json({ success: true, recurring: item })
  } catch (err) { next(err) }
}

async function deleteRecurring(req, res, next) {
  try {
    const deleted = await RecurringExpense.delete(parseInt(req.params.id), req.user.id)
    if (!deleted) return res.status(404).json({ message: 'Not found' })
    res.json({ success: true, message: 'Deleted' })
  } catch (err) { next(err) }
}

// Generate expenses for all due recurring items
async function generateDue(req, res, next) {
  try {
    const due = await RecurringExpense.getDue()
    const generated = []
    for (const item of due) {
      // Only generate for the logged-in user
      if (item.user_id !== req.user.id) continue
      const expense = await Expense.create(item.user_id, {
        title:    `${item.title} (Auto)`,
        amount:   item.amount,
        category: item.category,
        date:     item.next_due_date,
        notes:    `Auto-generated from recurring: ${item.title}`,
      })
      await RecurringExpense.advanceNextDue(item.id, item.frequency)
      generated.push(expense)
    }
    res.json({ success: true, generated: generated.length, expenses: generated })
  } catch (err) { next(err) }
}

module.exports = { getRecurring, createRecurring, updateRecurring, deleteRecurring, generateDue }
