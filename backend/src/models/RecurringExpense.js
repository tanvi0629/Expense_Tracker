// backend/src/models/RecurringExpense.js
const pool = require('../config/db')

const VALID_CATEGORIES  = ['Food','Transport','Shopping','Entertainment','Bills','Health','Education','Other']
const VALID_FREQUENCIES = ['daily','weekly','monthly','yearly']

const RecurringExpense = {
  async findAllByUser(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM recurring_expenses WHERE user_id = $1 ORDER BY next_due_date ASC`,
      [userId]
    )
    return rows
  },

  async create(userId, { title, amount, category, frequency, startDate, notes }) {
    const cat  = VALID_CATEGORIES.includes(category)   ? category  : 'Other'
    const freq = VALID_FREQUENCIES.includes(frequency) ? frequency : 'monthly'
    const { rows } = await pool.query(
      `INSERT INTO recurring_expenses (user_id, title, amount, category, frequency, start_date, next_due_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$6,$7) RETURNING *`,
      [userId, title.trim(), parseFloat(amount), cat, freq, startDate, notes?.trim() || null]
    )
    return rows[0]
  },

  async update(id, userId, fields) {
    const allowed = ['title','amount','category','frequency','next_due_date','notes','is_active']
    const sets = []; const vals = []; let i = 1
    for (const [k, v] of Object.entries(fields)) {
      if (allowed.includes(k)) { sets.push(`${k} = $${i++}`); vals.push(v) }
    }
    if (!sets.length) return null
    vals.push(id, userId)
    const { rows } = await pool.query(
      `UPDATE recurring_expenses SET ${sets.join(', ')} WHERE id = $${i++} AND user_id = $${i++} RETURNING *`,
      vals
    )
    return rows[0] || null
  },

  async delete(id, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM recurring_expenses WHERE id = $1 AND user_id = $2', [id, userId]
    )
    return rowCount > 0
  },

  async getDue() {
    const { rows } = await pool.query(
      `SELECT * FROM recurring_expenses WHERE is_active = true AND next_due_date <= CURRENT_DATE`
    )
    return rows
  },

  async advanceNextDue(id, frequency) {
    const map = { daily:'1 day', weekly:'1 week', monthly:'1 month', yearly:'1 year' }
    const interval = map[frequency] || '1 month'
    const { rows } = await pool.query(
      `UPDATE recurring_expenses SET next_due_date = next_due_date + INTERVAL '${interval}', last_generated = NOW() WHERE id = $1 RETURNING *`,
      [id]
    )
    return rows[0]
  }
}

module.exports = RecurringExpense
