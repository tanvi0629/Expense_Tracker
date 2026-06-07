// backend/src/routes/recurring.js
const router = require('express').Router()
const { authenticate } = require('../middleware/auth')
const { getRecurring, createRecurring, updateRecurring, deleteRecurring, generateDue } = require('../controllers/recurringController')

router.use(authenticate)
router.get('/',           getRecurring)
router.post('/',          createRecurring)
router.put('/:id',        updateRecurring)
router.delete('/:id',     deleteRecurring)
router.post('/generate',  generateDue)

module.exports = router
