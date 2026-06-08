const CategoryBudget = require('../models/CategoryBudget')
const pool = require('../config/db')

async function getCategoryBudgets(req, res, next) {
  try {
    const budgets = await CategoryBudget.findAllByUser(req.user.id)
    res.json({ success: true, budgets })
  } catch (err) { next(err) }
}

async function setCategoryBudget(req, res, next) {
  try {
    const { category, budget } = req.body
    if (!category) return res.status(400).json({ message: 'Category is required' })
    if (!budget || budget <= 0) return res.status(400).json({ message: 'Budget must be positive' })
    const result = await CategoryBudget.upsert(req.user.id, category, budget)
    res.json({ success: true, budget: result })
  } catch (err) { next(err) }
}

async function deleteCategoryBudget(req, res, next) {
  try {
    const deleted = await CategoryBudget.delete(parseInt(req.params.id), req.user.id)
    if (!deleted) return res.status(404).json({ message: 'Not found' })
    res.json({ success: true })
  } catch (err) { next(err) }
}

// Get alerts — compares current month spending vs category budgets
async function getAlerts(req, res, next) {
  try {
    const now = new Date()
    const startDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
    const endDate   = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().split('T')[0]

    const [budgets, spending] = await Promise.all([
      CategoryBudget.findAllByUser(req.user.id),
      pool.query(
        `SELECT category, COALESCE(SUM(amount),0) as spent
         FROM expenses WHERE user_id=$1 AND date>=$2 AND date<=$3
         GROUP BY category`,
        [req.user.id, startDate, endDate]
      )
    ])

    const spendingMap = spending.rows.reduce((acc, r) => {
      acc[r.category] = parseFloat(r.spent)
      return acc
    }, {})

    const alerts = budgets.map(b => {
      const spent   = spendingMap[b.category] || 0
      const percent = Math.round((spent / parseFloat(b.budget)) * 100)
      let level = 'safe'
      if (percent >= 100) level = 'exceeded'
      else if (percent >= 90) level = 'critical'
      else if (percent >= 75) level = 'warning'
      return {
        id:       b.id,
        category: b.category,
        budget:   parseFloat(b.budget),
        spent,
        percent,
        remaining: Math.max(0, parseFloat(b.budget) - spent),
        level,
      }
    }).sort((a,b) => b.percent - a.percent)

    res.json({ success: true, alerts })
  } catch (err) { next(err) }
}

module.exports = { getCategoryBudgets, setCategoryBudget, deleteCategoryBudget, getAlerts }
