// backend/src/controllers/receiptController.js
const cloudinary = require('cloudinary').v2
const pool = require('../config/db')

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Upload receipt image
async function uploadReceipt(req, res, next) {
  try {
    const { expenseId } = req.params
    const { imageBase64, mimeType } = req.body

    if (!imageBase64) return res.status(400).json({ message: 'Image data is required' })

    // Verify expense belongs to user
    const { rows } = await pool.query(
      'SELECT * FROM expenses WHERE id = $1 AND user_id = $2',
      [expenseId, req.user.id]
    )
    if (!rows[0]) return res.status(404).json({ message: 'Expense not found' })

    // Delete old receipt if exists
    if (rows[0].receipt_public_id) {
      await cloudinary.uploader.destroy(rows[0].receipt_public_id).catch(() => {})
    }

    // Upload to Cloudinary
    const dataUri = `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`
    const result  = await cloudinary.uploader.upload(dataUri, {
      folder:         'spendly-receipts',
      resource_type:  'image',
      transformation: [{ width: 1200, quality: 80, fetch_format: 'auto' }],
    })

    // Save URL to expense
    const { rows: updated } = await pool.query(
      'UPDATE expenses SET receipt_url = $1, receipt_public_id = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [result.secure_url, result.public_id, expenseId, req.user.id]
    )

    res.json({ success: true, receipt_url: result.secure_url, expense: updated[0] })
  } catch (err) {
    console.error('Receipt upload error:', err)
    next(err)
  }
}

// Delete receipt
async function deleteReceipt(req, res, next) {
  try {
    const { expenseId } = req.params
    const { rows } = await pool.query(
      'SELECT * FROM expenses WHERE id = $1 AND user_id = $2',
      [expenseId, req.user.id]
    )
    if (!rows[0]) return res.status(404).json({ message: 'Expense not found' })

    // Delete from Cloudinary
    if (rows[0].receipt_public_id) {
      await cloudinary.uploader.destroy(rows[0].receipt_public_id).catch(() => {})
    }

    // Clear from DB
    await pool.query(
      'UPDATE expenses SET receipt_url = NULL, receipt_public_id = NULL WHERE id = $1 AND user_id = $2',
      [expenseId, req.user.id]
    )

    res.json({ success: true, message: 'Receipt deleted' })
  } catch (err) {
    next(err)
  }
}

module.exports = { uploadReceipt, deleteReceipt }
