const router = require('express').Router()
const { authenticate } = require('../middleware/auth')
const { getCategoryBudgets, setCategoryBudget, deleteCategoryBudget, getAlerts } = require('../controllers/alertsController')

router.use(authenticate)
router.get('/',        getAlerts)
router.get('/budgets', getCategoryBudgets)
router.post('/budgets', setCategoryBudget)
router.delete('/budgets/:id', deleteCategoryBudget)

module.exports = router