// backend/src/routes/receipts.js
const router = require('express').Router()
const { authenticate } = require('../middleware/auth')
const { uploadReceipt, deleteReceipt } = require('../controllers/receiptController')

router.use(authenticate)
router.post('/:expenseId',   uploadReceipt)
router.delete('/:expenseId', deleteReceipt)

module.exports = router
