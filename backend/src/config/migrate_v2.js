// src/config/migrate_v2.js — Run: node src/config/migrate_v2.js
require('dotenv').config()
const pool = require('./db')

const schema = `
-- Recurring expenses table
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          VARCHAR(255) NOT NULL,
  amount         DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category       VARCHAR(50) NOT NULL DEFAULT 'Other',
  frequency      VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('daily','weekly','monthly','yearly')),
  start_date     DATE NOT NULL,
  next_due_date  DATE NOT NULL,
  last_generated TIMESTAMPTZ,
  notes          TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incomes table (in case not created yet)
CREATE TABLE IF NOT EXISTS incomes (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  amount      DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category    VARCHAR(50) NOT NULL DEFAULT 'Other',
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add currency preference to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(10) DEFAULT 'INR';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recurring_user_id      ON recurring_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_next_due     ON recurring_expenses(next_due_date);
CREATE INDEX IF NOT EXISTS idx_incomes_user_id        ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date           ON incomes(date);

-- Auto update triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recurring_updated_at ON recurring_expenses;
CREATE TRIGGER recurring_updated_at BEFORE UPDATE ON recurring_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS incomes_updated_at ON incomes;
CREATE TRIGGER incomes_updated_at BEFORE UPDATE ON incomes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`

;(async () => {
  const client = await pool.connect()
  try {
    await client.query(schema)
    console.log('✅ Migration v2 complete — recurring_expenses, incomes, currency column added')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
})()
