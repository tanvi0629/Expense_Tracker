const router = require('express').Router()
const { authenticate } = require('../middleware/auth')
const { getGoals, createGoal, updateGoal, addAmount, deleteGoal } = require('../controllers/goalsController')

router.use(authenticate)
router.get('/',           getGoals)
router.post('/',          createGoal)
router.put('/:id',        updateGoal)
router.post('/:id/add',   addAmount)
router.delete('/:id',     deleteGoal)

module.exports = router