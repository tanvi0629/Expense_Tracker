// backend/src/models/RecurringExpense.js
const pool = require('../config/db')

const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly']
const VALID_CATEGORIES  = ['Food','Transport','Shopping','Entertainment','Bills','Health','Education','Other']

const RecurringExpense = {
  async findAllByUser(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM recurring_expenses WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    )
    return rows
  },

  async create(userId, { title, amount, category, frequency, start_date, notes }) {
    const cat  = VALID_CATEGORIES.includes(category)  ? category  : 'Other'
    const freq = VALID_FREQUENCIES.includes(frequency) ? frequency : 'monthly'
    const { rows } = await pool.query(
      `INSERT INTO recurring_expenses (user_id, title, amount, category, frequency, start_date, next_due, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $6, $7) RETURNING *`,
      [userId, title.trim(), parseFloat(amount), cat, freq, start_date, notes?.trim() || null]
    )
    return rows[0]
  },

  async update(id, userId, { title, amount, category, frequency, start_date, is_active, notes }) {
    const fields = []
    const values = []
    let i = 1

    if (title      !== undefined) { fields.push(`title = $${i++}`);      values.push(title.trim()) }
    if (amount     !== undefined) { fields.push(`amount = $${i++}`);     values.push(parseFloat(amount)) }
    if (category   !== undefined) { fields.push(`category = $${i++}`);   values.push(VALID_CATEGORIES.includes(category) ? category : 'Other') }
    if (frequency  !== undefined) { fields.push(`frequency = $${i++}`);  values.push(VALID_FREQUENCIES.includes(frequency) ? frequency : 'monthly') }
    if (start_date !== undefined) { fields.push(`start_date = $${i++}`); values.push(start_date) }
    if (is_active  !== undefined) { fields.push(`is_active = $${i++}`);  values.push(is_active) }
    if (notes      !== undefined) { fields.push(`notes = $${i++}`);      values.push(notes?.trim() || null) }

    if (fields.length === 0) return null
    values.push(id, userId)
    const { rows } = await pool.query(
      `UPDATE recurring_expenses SET ${fields.join(', ')} WHERE id = $${i++} AND user_id = $${i++} RETURNING *`,
      values
    )
    return rows[0] || null
  },

  async delete(id, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM recurring_expenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    return rowCount > 0
  },

  // Get all active recurring expenses due today or earlier
  async getDueExpenses() {
    const { rows } = await pool.query(
      `SELECT * FROM recurring_expenses WHERE is_active = true AND next_due <= CURRENT_DATE`
    )
    return rows
  },

  // Update next_due date after processing
  async updateNextDue(id, frequency) {
    const intervalMap = {
      daily:   '1 day',
      weekly:  '7 days',
      monthly: '1 month',
      yearly:  '1 year',
    }
    await pool.query(
      `UPDATE recurring_expenses SET next_due = next_due + INTERVAL '${intervalMap[frequency]}' WHERE id = $1`,
      [id]
    )
  }
}

module.exports = RecurringExpense