// src/models/User.js
const pool = require('../config/db')

const User = {
  async findByFirebaseUid(firebaseUid) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [firebaseUid]
    )
    return rows[0] || null
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id])
    return rows[0] || null
  },

  async create({ firebaseUid, name, email, phoneNumber }) {
    const { rows } = await pool.query(
      `INSERT INTO users (firebase_uid, name, email, phone_number)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [firebaseUid, name || null, email || null, phoneNumber || null]
    )
    return rows[0]
  },

  async upsert({ firebaseUid, name, email, phoneNumber }) {
    const { rows } = await pool.query(
      `INSERT INTO users (firebase_uid, name, email, phone_number)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (firebase_uid) DO UPDATE
         SET name         = COALESCE(EXCLUDED.name, users.name),
             email        = COALESCE(EXCLUDED.email, users.email),
             phone_number = COALESCE(EXCLUDED.phone_number, users.phone_number),
             updated_at   = NOW()
       RETURNING *`,
      [firebaseUid, name || null, email || null, phoneNumber || null]
    )
    return rows[0]
  },

  async update(id, { name, monthlyBudget }) {
    const fields = []
    const values = []
    let i = 1

    if (name !== undefined)          { fields.push(`name = $${i++}`);            values.push(name) }
    if (monthlyBudget !== undefined) { fields.push(`monthly_budget = $${i++}`);  values.push(monthlyBudget) }

    if (fields.length === 0) return this.findById(id)

    values.push(id)
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    )
    return rows[0]
  },
}

module.exports = User
