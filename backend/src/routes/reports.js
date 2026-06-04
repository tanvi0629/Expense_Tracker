// backend/src/routes/reports.js
const router = require('express').Router()
const { authenticate } = require('../middleware/auth')
const { sendWeeklyReport, sendAllWeeklyReports } = require('../utils/emailReport')

router.use(authenticate)

// Send weekly report to current logged-in user
router.post('/weekly', async (req, res, next) => {
  try {
    const result = await sendWeeklyReport(req.user.id)
    res.json({ success: true, ...result })
  } catch (err) {
    next(err)
  }
})

// Send to all users (admin use)
router.post('/weekly/all', async (req, res, next) => {
  try {
    const results = await sendAllWeeklyReports()
    res.json({ success: true, results })
  } catch (err) {
    next(err)
  }
})

module.exports = router