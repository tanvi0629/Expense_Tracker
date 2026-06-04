// backend/src/models/Income.js
const pool = require('../config/db')

const VALID_CATEGORIES = ['Salary','Freelance','Business','Investment','Gift','Other']

const Income = {
  async findAllByUser(userId, { startDate, endDate, limit = 100, offset = 0 } = {}) {
    const conditions = ['user_id = $1']
    const values = [userId]
    let i = 2

    if (startDate) { conditions.push(`date >= $${i++}`); values.push(startDate) }
    if (endDate)   { conditions.push(`date <= $${i++}`); values.push(endDate) }

    const where = conditions.join(' AND ')
    const { rows } = await pool.query(
      `SELECT * FROM incomes WHERE ${where}
       ORDER BY date DESC, created_at DESC
       LIMIT $${i++} OFFSET $${i++}`,
      [...values, parseInt(limit), parseInt(offset)]
    )

    const { rows: stats } = await pool.query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
       FROM incomes WHERE ${where}`,
      values
    )

    return {
      incomes: rows,
      stats: {
        count: parseInt(stats[0].count),
        total: parseFloat(stats[0].total)
      }
    }
  },

  async create(userId, { title, amount, category, date, notes }) {
    const cat = VALID_CATEGORIES.includes(category) ? category : 'Other'
    const { rows } = await pool.query(
      `INSERT INTO incomes (user_id, title, amount, category, date, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, title.trim(), parseFloat(amount), cat, date, notes?.trim() || null]
    )
    return rows[0]
  },

  async update(id, userId, { title, amount, category, date, notes }) {
    const fields = []
    const values = []
    let i = 1

    if (title    !== undefined) { fields.push(`title = $${i++}`);    values.push(title.trim()) }
    if (amount   !== undefined) { fields.push(`amount = $${i++}`);   values.push(parseFloat(amount)) }
    if (category !== undefined) { fields.push(`category = $${i++}`); values.push(VALID_CATEGORIES.includes(category) ? category : 'Other') }
    if (date     !== undefined) { fields.push(`date = $${i++}`);     values.push(date) }
    if (notes    !== undefined) { fields.push(`notes = $${i++}`);    values.push(notes?.trim() || null) }

    if (fields.length === 0) return null

    values.push(id, userId)
    const { rows } = await pool.query(
      `UPDATE incomes SET ${fields.join(', ')}
       WHERE id = $${i++} AND user_id = $${i++} RETURNING *`,
      values
    )
    return rows[0] || null
  },

  async delete(id, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM incomes WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    return rowCount > 0
  }
}

module.exports = Income