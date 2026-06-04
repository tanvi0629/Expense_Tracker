// src/routes/expenses.js
const router = require('express').Router()
const { authenticate } = require('../middleware/auth')
const {
  getExpenses, createExpense, updateExpense, deleteExpense, exportCSV
} = require('../controllers/expenseController')

router.use(authenticate)

// Important: /export/csv must come before /:id
router.get('/export/csv', exportCSV)

router.get('/',      getExpenses)
router.post('/',     createExpense)
router.put('/:id',   updateExpense)
router.delete('/:id', deleteExpense)

module.exports = router
