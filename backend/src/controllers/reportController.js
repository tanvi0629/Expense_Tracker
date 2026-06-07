// backend/src/controllers/reportController.js
const sgMail = require('@sendgrid/mail')
const pool   = require('../config/db')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// Get email report settings
async function getReportSettings(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM email_reports WHERE user_id = $1',
      [req.user.id]
    )
    res.json({ success: true, settings: rows[0] || null })
  } catch (err) { next(err) }
}

// Save email report settings
async function saveReportSettings(req, res, next) {
  try {
    const { is_enabled, send_day } = req.body
    const { rows } = await pool.query(
      `INSERT INTO email_reports (user_id, is_enabled, send_day)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
         SET is_enabled = EXCLUDED.is_enabled,
             send_day   = EXCLUDED.send_day,
             updated_at = NOW()
       RETURNING *`,
      [req.user.id, is_enabled !== false, send_day || 'monday']
    )
    res.json({ success: true, settings: rows[0] })
  } catch (err) { next(err) }
}

// Build weekly summary HTML email
function buildEmailHTML(user, expenses, incomes, budget) {
  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0)
  const totalIncome   = incomes.reduce((s, i) => s + parseFloat(i.amount), 0)
  const savings       = totalIncome - totalExpenses
  const fmt = (n) => `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

  // Category breakdown
  const categories = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount)
    return acc
  }, {})

  const categoryRows = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${cat}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;">${fmt(amt)}</td>
      </tr>
    `).join('')

  const recentExpenses = expenses.slice(0, 5).map(e => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${e.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${e.category}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;color:#ef4444;">${fmt(e.amount)}</td>
    </tr>
  `).join('')

  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7)
  const weekEnd   = new Date()
  const dateRange = `${weekStart.toLocaleDateString('en-IN', { day:'numeric', month:'short' })} – ${weekEnd.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}`

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'DM Sans',Arial,sans-serif;background:#f8fafc;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
      <h1 style="color:white;margin:0;font-size:24px;font-weight:700;">💸 Spendly</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Weekly Financial Report</p>
      <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:12px;">${dateRange}</p>
    </div>

    <!-- Greeting -->
    <p style="color:#475569;font-size:15px;margin-bottom:24px;">
      Hi <strong>${user.name || 'there'}</strong>! Here's your weekly financial summary.
    </p>

    <!-- Stats cards -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
      <div style="background:white;border-radius:12px;padding:16px;border:1px solid #e2e8f0;">
        <p style="color:#64748b;font-size:12px;margin:0 0 4px;">Total Expenses</p>
        <p style="color:#ef4444;font-size:22px;font-weight:700;margin:0;">${fmt(totalExpenses)}</p>
      </div>
      <div style="background:white;border-radius:12px;padding:16px;border:1px solid #e2e8f0;">
        <p style="color:#64748b;font-size:12px;margin:0 0 4px;">Total Income</p>
        <p style="color:#22c55e;font-size:22px;font-weight:700;margin:0;">${fmt(totalIncome)}</p>
      </div>
      <div style="background:white;border-radius:12px;padding:16px;border:1px solid #e2e8f0;">
        <p style="color:#64748b;font-size:12px;margin:0 0 4px;">Savings</p>
        <p style="color:${savings >= 0 ? '#22c55e' : '#ef4444'};font-size:22px;font-weight:700;margin:0;">
          ${savings >= 0 ? '' : '-'}${fmt(savings)}
        </p>
      </div>
      <div style="background:white;border-radius:12px;padding:16px;border:1px solid #e2e8f0;">
        <p style="color:#64748b;font-size:12px;margin:0 0 4px;">Monthly Budget</p>
        <p style="color:#f59e0b;font-size:22px;font-weight:700;margin:0;">${fmt(budget || 0)}</p>
      </div>
    </div>

    <!-- Category breakdown -->
    ${categoryRows ? `
    <div style="background:white;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #e2e8f0;">
      <h2 style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 16px;">Spending by Category</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Category</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;">Amount</th>
          </tr>
        </thead>
        <tbody>${categoryRows}</tbody>
      </table>
    </div>` : ''}

    <!-- Recent expenses -->
    ${recentExpenses ? `
    <div style="background:white;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #e2e8f0;">
      <h2 style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 16px;">Recent Expenses</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Title</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;">Category</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;">Amount</th>
          </tr>
        </thead>
        <tbody>${recentExpenses}</tbody>
      </table>
    </div>` : ''}

    <!-- Footer -->
    <div style="text-align:center;padding:16px;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        You're receiving this because you enabled weekly reports in Spendly.<br>
        <a href="#" style="color:#22c55e;">Manage preferences</a>
      </p>
    </div>

  </div>
</body>
</html>`
}

// Send weekly report to a specific user
async function sendWeeklyReport(req, res, next) {
  try {
    const user = req.user
    if (!user.email) return res.status(400).json({ message: 'No email address found for this user' })

    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    const today   = new Date()
    const startDate = weekAgo.toISOString().split('T')[0]
    const endDate   = today.toISOString().split('T')[0]

    // Fetch this week's expenses and incomes
    const [expRes, incRes] = await Promise.all([
      pool.query(
        'SELECT * FROM expenses WHERE user_id = $1 AND date >= $2 AND date <= $3 ORDER BY date DESC',
        [user.id, startDate, endDate]
      ),
      pool.query(
        'SELECT * FROM incomes WHERE user_id = $1 AND date >= $2 AND date <= $3 ORDER BY date DESC',
        [user.id, startDate, endDate]
      )
    ])

    const html = buildEmailHTML(user, expRes.rows, incRes.rows, user.monthly_budget)

    await sgMail.send({
      to:      user.email,
      from:    process.env.SENDGRID_FROM_EMAIL,
      subject: `💸 Your Weekly Spendly Report — ${today.toLocaleDateString('en-IN', { day:'numeric', month:'long' })}`,
      html,
    })

    // Update last_sent_at
    await pool.query(
      `INSERT INTO email_reports (user_id, last_sent_at)
       VALUES ($1, NOW())
       ON CONFLICT (user_id) DO UPDATE SET last_sent_at = NOW()`,
      [user.id]
    )

    res.json({ success: true, message: `Report sent to ${user.email}` })
  } catch (err) {
    console.error('Email send error:', err?.response?.body || err.message)
    next(err)
  }
}

module.exports = { getReportSettings, saveReportSettings, sendWeeklyReport }
