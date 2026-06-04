// src/config/migrate.js
require('dotenv').config()
const pool = require('./db')

const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  firebase_uid    VARCHAR(128) UNIQUE NOT NULL,
  name            VARCHAR(255),
  email           VARCHAR(255) UNIQUE,
  phone_number    VARCHAR(30),
  monthly_budget  DECIMAL(12, 2) DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  amount      DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  category    VARCHAR(50) NOT NULL DEFAULT 'Other',
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id   ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date       ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category   ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid  ON users(firebase_uid);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at    ON users;
DROP TRIGGER IF EXISTS expenses_updated_at ON expenses;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`

;(async () => {
  const client = await pool.connect()
  try {
    await client.query(schema)
    console.log('✅ Database migration complete')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
})()
