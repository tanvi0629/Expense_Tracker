const pool = require('../config/db')

const SavingsGoal = {
  async findAllByUser(userId) {
    const { rows } = await pool.query(
      'SELECT * FROM savings_goals WHERE user_id = $1 ORDER BY created_at DESC', [userId]
    )
    return rows
  },

  async create(userId, { title, targetAmount, currentAmount, emoji, color, deadline }) {
    const { rows } = await pool.query(
      `INSERT INTO savings_goals (user_id, title, target_amount, current_amount, emoji, color, deadline)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [userId, title.trim(), parseFloat(targetAmount), parseFloat(currentAmount||0),
       emoji||'🎯', color||'brand', deadline||null]
    )
    return rows[0]
  },

  async update(id, userId, fields) {
    const allowed = ['title','target_amount','current_amount','emoji','color','deadline','is_completed']
    const sets = []; const vals = []; let i = 1
    for (const [k,v] of Object.entries(fields)) {
      if (allowed.includes(k)) { sets.push(`${k} = $${i++}`); vals.push(v) }
    }
    if (!sets.length) return null
    vals.push(id, userId)
    const { rows } = await pool.query(
      `UPDATE savings_goals SET ${sets.join(',')} WHERE id=$${i++} AND user_id=$${i++} RETURNING *`, vals
    )
    return rows[0] || null
  },

  async addAmount(id, userId, amount) {
    const { rows } = await pool.query(
      `UPDATE savings_goals
       SET current_amount = LEAST(current_amount + $1, target_amount),
           is_completed = (current_amount + $1 >= target_amount)
       WHERE id=$2 AND user_id=$3 RETURNING *`,
      [parseFloat(amount), id, userId]
    )
    return rows[0] || null
  },

  async delete(id, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM savings_goals WHERE id=$1 AND user_id=$2', [id, userId]
    )
    return rowCount > 0
  }
}

module.exports = SavingsGoal