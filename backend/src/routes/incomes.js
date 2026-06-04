// backend/src/routes/incomes.js
const router = require('express').Router()
const { authenticate } = require('../middleware/auth')
const { getIncomes, createIncome, updateIncome, deleteIncome } = require('../controllers/incomeController')

router.use(authenticate)

router.get('/',       getIncomes)
router.post('/',      createIncome)
router.put('/:id',    updateIncome)
router.delete('/:id', deleteIncome)

module.exports = router