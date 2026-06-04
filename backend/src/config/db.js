// src/config/db.js
const { Pool } = require('pg')

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      }
    : {
        host:     process.env.DB_HOST || 'localhost',
        port:     parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'tracker',
        user:     process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
      }
)

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err)
})
pool.query("SELECT current_database()")
  .then(r => console.log("DB:", r.rows[0].current_database))
  .catch(err => console.error("DB Error:", err));

module.exports = pool
