const pool = require('../config/db')

const CategoryBudget = {
  async findAllByUser(userId) {
    const { rows } = await pool.query(
      'SELECT * FROM category_budgets WHERE user_id=$1 ORDER BY category', [userId]
    )
    return rows
  },

  async upsert(userId, category, budget) {
    const { rows } = await pool.query(
      `INSERT INTO category_budgets (user_id, category, budget)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, category) DO UPDATE SET budget=EXCLUDED.budget, updated_at=NOW()
       RETURNING *`,
      [userId, category, parseFloat(budget)]
    )
    return rows[0]
  },

  async delete(id, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM category_budgets WHERE id=$1 AND user_id=$2', [id, userId]
    )
    return rowCount > 0
  }
}

module.exports = CategoryBudget
