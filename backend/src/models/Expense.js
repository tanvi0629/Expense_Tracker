// src/models/Expense.js
const pool = require('../config/db')

const VALID_CATEGORIES = ['Food','Transport','Shopping','Entertainment','Bills','Health','Education','Other']

const Expense = {
  async findAllByUser(userId, { search, category, startDate, endDate, limit = 100, offset = 0 } = {}) {
    const conditions = ['e.user_id = $1']
    const values = [userId]
    let i = 2

    if (search) {
      conditions.push(`(e.title ILIKE $${i} OR e.notes ILIKE $${i})`)
      values.push(`%${search}%`)
      i++
    }
    if (category && VALID_CATEGORIES.includes(category)) {
      conditions.push(`e.category = $${i++}`)
      values.push(category)
    }
    if (startDate) {
      conditions.push(`e.date >= $${i++}`)
      values.push(startDate)
    }
    if (endDate) {
      conditions.push(`e.date <= $${i++}`)
      values.push(endDate)
    }

    const where = conditions.join(' AND ')
    const { rows } = await pool.query(
      `SELECT e.*
       FROM expenses e
       WHERE ${where}
       ORDER BY e.date DESC, e.created_at DESC
       LIMIT $${i++} OFFSET $${i++}`,
      [...values, parseInt(limit), parseInt(offset)]
    )

    // Stats
    const { rows: statsRows } = await pool.query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
       FROM expenses e WHERE ${where}`,
      values
    )

    return { expenses: rows, stats: { count: parseInt(statsRows[0].count), total: parseFloat(statsRows[0].total) } }
  },

  async findById(id, userId) {
    const { rows } = await pool.query(
      'SELECT * FROM expenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    return rows[0] || null
  },

  async create(userId, { title, amount, category, date, notes }) {
    const cat = VALID_CATEGORIES.includes(category) ? category : 'Other'
    const { rows } = await pool.query(
      `INSERT INTO expenses (user_id, title, amount, category, date, notes)
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

    if (fields.length === 0) return this.findById(id, userId)

    values.push(id, userId)
    const { rows } = await pool.query(
      `UPDATE expenses SET ${fields.join(', ')} WHERE id = $${i++} AND user_id = $${i++} RETURNING *`,
      values
    )
    return rows[0] || null
  },

  async delete(id, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    return rowCount > 0
  },

  async getAllForExport(userId) {
    const { rows } = await pool.query(
      `SELECT title, amount, category, date, notes, created_at
       FROM expenses WHERE user_id = $1 ORDER BY date DESC`,
      [userId]
    )
    return rows
  },
}

module.exports = Expense
