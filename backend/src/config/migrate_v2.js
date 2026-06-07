
require('dotenv').config()
const pool = require('./db')

const schema = `

CREATE TABLE IF NOT EXISTS users (
  id                 SERIAL PRIMARY KEY,
  firebase_uid       VARCHAR(128) UNIQUE NOT NULL,
  name               VARCHAR(255),
  email              VARCHAR(255) UNIQUE,
  phone_number       VARCHAR(30),
  monthly_budget     DECIMAL(12,2) DEFAULT 0,
  preferred_currency VARCHAR(10)   DEFAULT 'INR',
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Add columns if they don't exist (safe for existing installs)
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(10) DEFAULT 'INR';
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ─────────────────────────────────────────
-- EXPENSES TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id                 SERIAL PRIMARY KEY,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title              VARCHAR(255) NOT NULL,
  amount             DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category           VARCHAR(50)  NOT NULL DEFAULT 'Other',
  date               DATE         NOT NULL DEFAULT CURRENT_DATE,
  notes              TEXT,
  receipt_url        TEXT,
  receipt_public_id  TEXT,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Add receipt columns if they don't exist (safe for existing installs)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url       TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_public_id TEXT;

-- ─────────────────────────────────────────
-- INCOMES TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incomes (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  amount      DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category    VARCHAR(50)  NOT NULL DEFAULT 'Other',
  date        DATE         NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- RECURRING EXPENSES TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          VARCHAR(255) NOT NULL,
  amount         DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category       VARCHAR(50)  NOT NULL DEFAULT 'Other',
  frequency      VARCHAR(20)  NOT NULL DEFAULT 'monthly'
                   CHECK (frequency IN ('daily','weekly','monthly','yearly')),
  start_date     DATE         NOT NULL,
  next_due_date  DATE         NOT NULL,
  last_generated TIMESTAMPTZ,
  notes          TEXT,
  is_active      BOOLEAN      NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- EMAIL REPORTS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_reports (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  is_enabled   BOOLEAN     NOT NULL DEFAULT true,
  send_day     VARCHAR(10) NOT NULL DEFAULT 'monday',
  last_sent_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid       ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id         ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date            ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category        ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_incomes_user_id          ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date             ON incomes(date);
CREATE INDEX IF NOT EXISTS idx_recurring_user_id        ON recurring_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_next_due       ON recurring_expenses(next_due_date);
CREATE INDEX IF NOT EXISTS idx_email_reports_user_id    ON email_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_email_reports_enabled    ON email_reports(is_enabled);

-- ─────────────────────────────────────────
-- AUTO UPDATE updated_at TRIGGER
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at             ON users;
DROP TRIGGER IF EXISTS expenses_updated_at          ON expenses;
DROP TRIGGER IF EXISTS incomes_updated_at           ON incomes;
DROP TRIGGER IF EXISTS recurring_updated_at         ON recurring_expenses;
DROP TRIGGER IF EXISTS email_reports_updated_at     ON email_reports;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER incomes_updated_at
  BEFORE UPDATE ON incomes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER recurring_updated_at
  BEFORE UPDATE ON recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER email_reports_updated_at
  BEFORE UPDATE ON email_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`

;(async () => {
  const client = await pool.connect()
  try {
    await client.query(schema)
    console.log('')
    console.log('✅ Final migration complete!')
    console.log('   Tables: users, expenses, incomes, recurring_expenses, email_reports')
    console.log('   Columns: receipt_url, receipt_public_id, preferred_currency, updated_at')
    console.log('   Indexes: all created')
    console.log('   Triggers: updated_at auto-update on all tables')
    console.log('')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
})()