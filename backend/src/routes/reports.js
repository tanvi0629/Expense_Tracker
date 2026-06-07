// backend/src/routes/reports.js
const router = require('express').Router()
const { authenticate } = require('../middleware/auth')
const { getReportSettings, saveReportSettings, sendWeeklyReport } = require('../controllers/reportController')

router.use(authenticate)
router.get('/settings',  getReportSettings)
router.post('/settings', saveReportSettings)
router.post('/send',     sendWeeklyReport)

module.exports = router
