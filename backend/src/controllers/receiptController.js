// backend/src/controllers/receiptController.js
const pool = require('../config/db')

// Upload receipt as base64 — stored in expenses table
async function uploadReceipt(req, res, next) {
  try {
    const { id } = req.params
    const { receipt_base64, receipt_mime } = req.body

    if (!receipt_base64) return res.status(400).json({ message: 'receipt_base64 is required' })

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (receipt_mime && !allowedMimes.includes(receipt_mime)) {
      return res.status(400).json({ message: 'Only JPEG, PNG, WebP images are supported' })
    }

    // Check size (~5MB limit in base64)
    if (receipt_base64.length > 7 * 1024 * 1024) {
      return res.status(400).json({ message: 'Image too large. Max 5MB.' })
    }

    const { rows } = await pool.query(
      `UPDATE expenses
       SET receipt_base64 = $1, receipt_mime = $2
       WHERE id = $3 AND user_id = $4
       RETURNING id, receipt_mime`,
      [receipt_base64, receipt_mime || 'image/jpeg', parseInt(id), req.user.id]
    )

    if (!rows[0]) return res.status(404).json({ message: 'Expense not found' })
    res.json({ success: true, message: 'Receipt uploaded', expense_id: rows[0].id })
  } catch (err) { next(err) }
}

async function getReceipt(req, res, next) {
  try {
    const { id } = req.params
    const { rows } = await pool.query(
      `SELECT receipt_base64, receipt_mime FROM expenses WHERE id = $1 AND user_id = $2`,
      [parseInt(id), req.user.id]
    )
    if (!rows[0] || !rows[0].receipt_base64) {
      return res.status(404).json({ message: 'No receipt found' })
    }
    res.json({ success: true, receipt_base64: rows[0].receipt_base64, receipt_mime: rows[0].receipt_mime })
  } catch (err) { next(err) }
}

async function deleteReceipt(req, res, next) {
  try {
    const { id } = req.params
    await pool.query(
      `UPDATE expenses SET receipt_base64 = NULL, receipt_mime = NULL WHERE id = $1 AND user_id = $2`,
      [parseInt(id), req.user.id]
    )
    res.json({ success: true, message: 'Receipt deleted' })
  } catch (err) { next(err) }
}

module.exports = { uploadReceipt, getReceipt, deleteReceipt }