// backend/src/utils/emailReport.js
const nodemailer = require('nodemailer')
const pool       = require('../config/db')

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password
    },
  })
}

async function getUserWeeklyStats(userId) {
  const { rows: expenses } = await pool.query(
    `SELECT category, SUM(amount) as total, COUNT(*) as count
     FROM expenses
     WHERE user_id = $1
       AND date >= CURRENT_DATE - INTERVAL '7 days'
     GROUP BY category
     ORDER BY total DESC`,
    [userId]
  )

  const { rows: totals } = await pool.query(
    `SELECT
       COALESCE(SUM(amount), 0) as week_total,
       COALESCE((SELECT SUM(amount) FROM expenses WHERE user_id = $1 AND date >= date_trunc('month', CURRENT_DATE)), 0) as month_total
     FROM expenses
     WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'`,
    [userId]
  )

  const { rows: user } = await pool.query(
    'SELECT name, email, monthly_budget FROM users WHERE id = $1',
    [userId]
  )

  return {
    user: user[0],
    categories: expenses,
    weekTotal: parseFloat(totals[0].week_total),
    monthTotal: parseFloat(totals[0].month_total),
  }
}

function generateEmailHTML(stats) {
  const { user, categories, weekTotal, monthTotal } = stats
  const budget  = parseFloat(user.monthly_budget || 0)
  const savings = Math.max(0, budget - monthTotal)
  const spentPct = budget > 0 ? Math.min(100, (monthTotal / budget) * 100).toFixed(0) : 0

  const categoryRows = categories.map(c => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${c.category}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;">₹${parseFloat(c.total).toFixed(0)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;">${c.count} txn</td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:32px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">📊 Weekly Report</h1>
      <p style="color:#bbf7d0;margin:8px 0 0;">Hi ${user.name || 'there'}! Here's your Spendly summary</p>
    </div>

    <!-- Stats -->
    <div style="display:flex;gap:0;border-bottom:1px solid #f1f5f9;">
      <div style="flex:1;padding:20px;text-align:center;border-right:1px solid #f1f5f9;">
        <p style="color:#64748b;font-size:12px;margin:0 0 4px;">This Week</p>
        <p style="color:#0f172a;font-size:22px;font-weight:700;margin:0;">₹${weekTotal.toFixed(0)}</p>
      </div>
      <div style="flex:1;padding:20px;text-align:center;border-right:1px solid #f1f5f9;">
        <p style="color:#64748b;font-size:12px;margin:0 0 4px;">This Month</p>
        <p style="color:#0f172a;font-size:22px;font-weight:700;margin:0;">₹${monthTotal.toFixed(0)}</p>
      </div>
      <div style="flex:1;padding:20px;text-align:center;">
        <p style="color:#64748b;font-size:12px;margin:0 0 4px;">Savings</p>
        <p style="color:#22c55e;font-size:22px;font-weight:700;margin:0;">₹${savings.toFixed(0)}</p>
      </div>
    </div>

    <!-- Budget bar -->
    ${budget > 0 ? `
    <div style="padding:20px 24px;">
      <p style="color:#64748b;font-size:13px;margin:0 0 8px;">Budget usage: ${spentPct}% of ₹${budget.toFixed(0)}</p>
      <div style="background:#f1f5f9;border-radius:99px;height:10px;">
        <div style="background:${spentPct > 90 ? '#ef4444' : spentPct > 70 ? '#f59e0b' : '#22c55e'};width:${spentPct}%;height:10px;border-radius:99px;transition:width 0.3s;"></div>
      </div>
    </div>` : ''}

    <!-- Category breakdown -->
    ${categories.length > 0 ? `
    <div style="padding:0 24px 24px;">
      <p style="color:#0f172a;font-weight:600;margin:0 0 12px;">Spending by Category</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:8px 12px;text-align:left;color:#64748b;font-weight:500;">Category</th>
            <th style="padding:8px 12px;text-align:right;color:#64748b;font-weight:500;">Amount</th>
            <th style="padding:8px 12px;text-align:right;color:#64748b;font-weight:500;">Txns</th>
          </tr>
        </thead>
        <tbody>${categoryRows}</tbody>
      </table>
    </div>` : '<p style="padding:20px 24px;color:#64748b;text-align:center;">No expenses this week 🎉</p>'}

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 24px;text-align:center;border-top:1px solid #f1f5f9;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">Sent by <strong>Spendly</strong> · Your personal expense tracker</p>
    </div>
  </div>
</body>
</html>`
}

async function sendWeeklyReport(userId) {
  const transporter = createTransporter()
  const stats = await getUserWeeklyStats(userId)

  if (!stats.user?.email) throw new Error('No email address for user')

  await transporter.sendMail({
    from:    `"Spendly" <${process.env.EMAIL_USER}>`,
    to:      stats.user.email,
    subject: `📊 Your Weekly Spendly Report — ₹${stats.weekTotal.toFixed(0)} spent`,
    html:    generateEmailHTML(stats),
  })

  return { sent: true, to: stats.user.email }
}

// Send weekly reports to all users who have email
async function sendAllWeeklyReports() {
  const { rows: users } = await pool.query(
    `SELECT id FROM users WHERE email IS NOT NULL AND email != ''`
  )

  const results = []
  for (const user of users) {
    try {
      const r = await sendWeeklyReport(user.id)
      results.push({ userId: user.id, ...r })
    } catch (err) {
      results.push({ userId: user.id, error: err.message })
    }
  }
  return results
}

module.exports = { sendWeeklyReport, sendAllWeeklyReports }