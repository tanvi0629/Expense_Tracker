// backend/src/controllers/recurringController.js
const RecurringExpense = require('../models/RecurringExpense')
const Expense          = require('../models/Expense')

async function getRecurring(req, res, next) {
  try {
    const rows = await RecurringExpense.findAllByUser(req.user.id)
    res.json({ success: true, recurring: rows })
  } catch (err) { next(err) }
}

async function createRecurring(req, res, next) {
  try {
    const { title, amount, category, frequency, start_date, notes } = req.body
    if (!title?.trim())    return res.status(400).json({ message: 'Title is required' })
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Amount must be positive' })
    if (!start_date)       return res.status(400).json({ message: 'Start date is required' })

    const recurring = await RecurringExpense.create(req.user.id, { title, amount, category, frequency, start_date, notes })
    res.status(201).json({ success: true, recurring })
  } catch (err) { next(err) }
}

async function updateRecurring(req, res, next) {
  try {
    const recurring = await RecurringExpense.update(parseInt(req.params.id), req.user.id, req.body)
    if (!recurring) return res.status(404).json({ message: 'Not found' })
    res.json({ success: true, recurring })
  } catch (err) { next(err) }
}

async function deleteRecurring(req, res, next) {
  try {
    const deleted = await RecurringExpense.delete(parseInt(req.params.id), req.user.id)
    if (!deleted) return res.status(404).json({ message: 'Not found' })
    res.json({ success: true, message: 'Deleted' })
  } catch (err) { next(err) }
}

// Process due recurring expenses — called by a cron or manually
async function processDue(req, res, next) {
  try {
    const due = await RecurringExpense.getDueExpenses()
    const created = []

    for (const r of due) {
      // Auto-create expense entry
      const exp = await Expense.create(r.user_id, {
        title:    r.title,
        amount:   r.amount,
        category: r.category,
        date:     new Date().toISOString().slice(0, 10),
        notes:    `Auto-generated from recurring: ${r.frequency}`,
      })
      await RecurringExpense.updateNextDue(r.id, r.frequency)
      created.push(exp)
    }

    res.json({ success: true, processed: created.length, expenses: created })
  } catch (err) { next(err) }
}

module.exports = { getRecurring, createRecurring, updateRecurring, deleteRecurring, processDue }