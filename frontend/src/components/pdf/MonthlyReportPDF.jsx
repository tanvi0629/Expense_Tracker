// src/components/pdf/MonthlyReportPDF.jsx
import React, { useState, useRef } from 'react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  FileText, Download, Loader2, Sparkles, TrendingDown,
  TrendingUp, PiggyBank, Calendar, X, Check, RefreshCw
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899']

// ── AI Recommendations via Groq ─────────────────────────────────────────────
async function getAIRecommendations(data, apiKey) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'system',
        content: `You are a financial advisor. Analyze spending data and give exactly 4 specific, actionable recommendations.
Return ONLY a JSON array like:
[{"title":"Short title","detail":"Specific advice with numbers","type":"tip|warning|success|info"}]
No other text. Use Indian Rupees (₹).`
      }, {
        role: 'user',
        content: `Monthly financial data:
Total Income: ₹${data.totalIncome}
Total Expenses: ₹${data.totalExpenses}
Savings: ₹${data.savings}
Budget: ₹${data.budget}
Top categories: ${JSON.stringify(data.topCategories)}
Transactions: ${data.transactionCount}
Month: ${data.month}

Give 4 specific recommendations.`
      }],
      max_tokens: 600,
      temperature: 0.4,
    })
  })
  const json = await res.json()
  const text = json.choices?.[0]?.message?.content || '[]'
  const match = text.match(/\[[\s\S]*\]/)
  return match ? JSON.parse(match[0]) : []
}

// ── PDF Generator (pure HTML → window.print) ───────────────────────────────
function generatePDFHTML(reportData, recommendations) {
  const { month, totalIncome, totalExpenses, savings, budget, topCategories,
    transactionCount, recentExpenses, savingsRate, budgetUsed } = reportData

  const fmt = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`
  const categoryRows = topCategories.map((c, i) => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:10px;height:10px;border-radius:50%;background:${COLORS[i % COLORS.length]};flex-shrink:0;"></div>
          ${c.category}
        </div>
      </td>
      <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;">${fmt(c.amount)}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;text-align:right;color:#64748b;">${c.percent}%</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;">
        <div style="background:#f1f5f9;border-radius:4px;height:6px;width:100%;min-width:80px;">
          <div style="background:${COLORS[i % COLORS.length]};height:6px;border-radius:4px;width:${c.percent}%;"></div>
        </div>
      </td>
    </tr>`).join('')

  const recentRows = recentExpenses.slice(0,8).map(e => `
    <tr>
      <td style="padding:8px 16px;border-bottom:1px solid #f8fafc;">${e.title}</td>
      <td style="padding:8px 16px;border-bottom:1px solid #f8fafc;color:#64748b;">${e.category}</td>
      <td style="padding:8px 16px;border-bottom:1px solid #f8fafc;color:#64748b;">${e.date}</td>
      <td style="padding:8px 16px;border-bottom:1px solid #f8fafc;text-align:right;font-weight:600;color:#ef4444;">${fmt(e.amount)}</td>
    </tr>`).join('')

  const recColors = { tip:'#22c55e', warning:'#f59e0b', success:'#3b82f6', info:'#8b5cf6' }
  const recIcons  = { tip:'💡', warning:'⚠️', success:'✅', info:'ℹ️' }
  const recRows = recommendations.map(r => `
    <div style="border-left:4px solid ${recColors[r.type]||'#22c55e'};padding:12px 16px;margin-bottom:12px;background:#f8fafc;border-radius:0 8px 8px 0;">
      <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${recIcons[r.type]||'💡'} ${r.title}</div>
      <div style="color:#475569;font-size:13px;line-height:1.5;">${r.detail}</div>
    </div>`).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Spendly — ${month} Financial Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: white; font-size: 14px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    .container { max-width: 900px; margin: 0 auto; padding: 40px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 10px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; background: #f8fafc; }
  </style>
</head>
<body>
<div class="container">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:16px;padding:40px;margin-bottom:32px;color:white;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-size:24px;font-weight:800;margin-bottom:4px;">💸 Spendly</div>
        <div style="font-size:32px;font-weight:800;margin:8px 0;">${month} Financial Report</div>
        <div style="opacity:0.8;font-size:14px;">Generated on ${format(new Date(),'dd MMMM yyyy')}</div>
      </div>
      <div style="text-align:right;opacity:0.9;">
        <div style="font-size:13px;">Savings Rate</div>
        <div style="font-size:48px;font-weight:800;">${savingsRate}%</div>
      </div>
    </div>
  </div>

  <!-- Summary cards -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px;">
    ${[
      { label:'Total Income',   value:fmt(totalIncome),   color:'#22c55e', bg:'#f0fdf4' },
      { label:'Total Expenses', value:fmt(totalExpenses), color:'#ef4444', bg:'#fef2f2' },
      { label:'Net Savings',    value:fmt(savings),       color:'#3b82f6', bg:'#eff6ff' },
      { label:'Budget Used',    value:`${budgetUsed}%`,   color:'#f59e0b', bg:'#fffbeb' },
    ].map(c => `
    <div style="background:${c.bg};border-radius:12px;padding:20px;border:1px solid ${c.color}20;">
      <div style="font-size:12px;color:#64748b;margin-bottom:8px;">${c.label}</div>
      <div style="font-size:24px;font-weight:800;color:${c.color};">${c.value}</div>
    </div>`).join('')}
  </div>

  <!-- Key metrics -->
  <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:32px;">
    <div style="font-size:16px;font-weight:700;margin-bottom:16px;">📊 Key Metrics</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
      <div><div style="color:#64748b;font-size:12px;">Transactions</div><div style="font-weight:700;font-size:18px;">${transactionCount}</div></div>
      <div><div style="color:#64748b;font-size:12px;">Daily Average</div><div style="font-weight:700;font-size:18px;">${fmt(totalExpenses/30)}</div></div>
      <div><div style="color:#64748b;font-size:12px;">Budget Status</div><div style="font-weight:700;font-size:18px;color:${budget>0&&totalExpenses>budget?'#ef4444':'#22c55e'}">${budget>0&&totalExpenses>budget?'Over Budget':'On Track'}</div></div>
    </div>
  </div>

  <!-- Category breakdown -->
  <div style="margin-bottom:32px;">
    <div style="font-size:18px;font-weight:700;margin-bottom:16px;">🏷️ Spending by Category</div>
    <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <table>
        <thead><tr><th>Category</th><th style="text-align:right;">Amount</th><th style="text-align:right;">Share</th><th style="min-width:100px;">Distribution</th></tr></thead>
        <tbody>${categoryRows}</tbody>
      </table>
    </div>
  </div>

  <!-- Recent transactions -->
  <div style="margin-bottom:32px;" class="page-break">
    <div style="font-size:18px;font-weight:700;margin-bottom:16px;">🧾 Recent Transactions</div>
    <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <table>
        <thead><tr><th>Description</th><th>Category</th><th>Date</th><th style="text-align:right;">Amount</th></tr></thead>
        <tbody>${recentRows}</tbody>
      </table>
    </div>
  </div>

  <!-- AI Recommendations -->
  <div style="margin-bottom:32px;">
    <div style="font-size:18px;font-weight:700;margin-bottom:8px;">🤖 AI-Powered Recommendations</div>
    <div style="color:#64748b;font-size:13px;margin-bottom:16px;">Personalized insights generated by Penny AI based on your spending patterns</div>
    ${recRows || '<div style="color:#94a3b8;padding:16px;">No recommendations available.</div>'}
  </div>

  <!-- Footer -->
  <div style="border-top:2px solid #e2e8f0;padding-top:20px;text-align:center;color:#94a3b8;font-size:12px;">
    <p>Generated by <strong>Spendly</strong> • ${format(new Date(),'dd MMM yyyy, HH:mm')}</p>
    <p style="margin-top:4px;">This report is for personal use only. Powered by AI financial analysis.</p>
  </div>

</div>
</body>
</html>`
}

// ── Main Component ────────────────────────────────────────────────────────
export default function MonthlyReportPDF({ onClose }) {
  const { dbUser } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [loading, setLoading]   = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [step, setStep]         = useState('config') // config | preview | done
  const previewRef = useRef(null)

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i)
    return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') }
  })

  const generateReport = async () => {
    setLoading(true)
    try {
      const [year, month] = selectedMonth.split('-')
      const startDate = `${year}-${month}-01`
      const endDate   = format(endOfMonth(new Date(parseInt(year), parseInt(month)-1, 1)), 'yyyy-MM-dd')

      const [expRes, incRes] = await Promise.all([
        api.get('/expenses', { params: { start_date: startDate, end_date: endDate, limit: 500 } }),
        api.get('/incomes',  { params: { start_date: startDate, end_date: endDate, limit: 200 } }),
      ])

      const expenses = expRes.data.expenses || []
      const incomes  = incRes.data.incomes  || []
      const budget   = parseFloat(dbUser?.monthly_budget || 0)

      const totalExpenses = expenses.reduce((s,e) => s + parseFloat(e.amount), 0)
      const totalIncome   = incomes.reduce((s,i)  => s + parseFloat(i.amount), 0)
      const savings       = totalIncome - totalExpenses
      const savingsRate   = totalIncome > 0 ? Math.round((savings/totalIncome)*100) : 0
      const budgetUsed    = budget > 0 ? Math.round((totalExpenses/budget)*100) : 0

      // Category totals
      const catMap = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category]||0) + parseFloat(e.amount)
        return acc
      }, {})
      const topCategories = Object.entries(catMap)
        .sort((a,b) => b[1]-a[1])
        .slice(0,6)
        .map(([category, amount]) => ({
          category,
          amount: Math.round(amount),
          percent: Math.round((amount/totalExpenses)*100)
        }))

      const data = {
        month:            format(new Date(parseInt(year), parseInt(month)-1, 1), 'MMMM yyyy'),
        totalIncome:      Math.round(totalIncome),
        totalExpenses:    Math.round(totalExpenses),
        savings:          Math.round(savings),
        budget,
        savingsRate,
        budgetUsed,
        topCategories,
        transactionCount: expenses.length,
        recentExpenses:   expenses.slice(0,8).map(e => ({
          title:    e.title,
          category: e.category,
          amount:   parseFloat(e.amount),
          date:     format(new Date(e.date), 'dd MMM'),
        })),
      }

      setReportData(data)

      // Generate AI recommendations
      const apiKey = import.meta.env.VITE_GROQ_API_KEY
      if (apiKey && expenses.length > 0) {
        setAiLoading(true)
        try {
          const recs = await getAIRecommendations(data, apiKey)
          setRecommendations(recs)
        } catch (_) {
          setRecommendations([
            { title: 'Track daily spending', detail: 'Log every expense to build better financial habits.', type: 'tip' },
            { title: 'Build an emergency fund', detail: 'Aim for 3-6 months of expenses in savings.', type: 'info' },
          ])
        } finally {
          setAiLoading(false)
        }
      }

      setStep('preview')
    } catch (err) {
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = () => {
    const html = generatePDFHTML(reportData, recommendations)
    const win  = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    setTimeout(() => {
      win.focus()
      win.print()
      toast.success('PDF download dialog opened!')
    }, 500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl card shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <FileText size={18} className="text-red-500" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">AI Monthly Report</p>
              <p className="text-xs text-slate-500">PDF with AI recommendations</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          {step === 'config' && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Month</label>
                <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="input-field">
                  {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              {/* What's included */}
              <div className="card p-4 bg-slate-50 dark:bg-slate-800/50">
                <p className="font-semibold text-slate-900 dark:text-white text-sm mb-3">📋 Report includes</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    '💰 Income vs Expenses summary',
                    '📊 Category breakdown with charts',
                    '💡 4 AI-powered recommendations',
                    '🧾 Recent transaction list',
                    '📈 Savings rate & budget status',
                    '🎯 Key financial metrics',
                  ].map((item,i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Check size={12} className="text-brand-500 flex-shrink-0" />{item}
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={generateReport} disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Generating report...</>
                  : <><Sparkles size={16} /> Generate Report</>
                }
              </button>
            </>
          )}

          {step === 'preview' && reportData && (
            <>
              {/* AI loading indicator */}
              {aiLoading && (
                <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-3">
                  <Loader2 size={14} className="animate-spin text-purple-500" />
                  <p className="text-sm text-purple-700 dark:text-purple-400">Penny AI is writing recommendations...</p>
                </div>
              )}

              {/* Report preview */}
              <div className="space-y-4">
                {/* Month header */}
                <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl p-5 text-white">
                  <p className="text-brand-100 text-sm">Financial Report</p>
                  <p className="text-2xl font-bold font-display">{reportData.month}</p>
                  <p className="text-brand-100 text-sm mt-1">Savings Rate: {reportData.savingsRate}%</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label:'Income',   value:`₹${reportData.totalIncome.toLocaleString()}`,   color:'text-brand-500', icon: TrendingUp },
                    { label:'Expenses', value:`₹${reportData.totalExpenses.toLocaleString()}`, color:'text-red-500',   icon: TrendingDown },
                    { label:'Savings',  value:`₹${reportData.savings.toLocaleString()}`,       color:'text-blue-500',  icon: PiggyBank },
                  ].map((s,i) => (
                    <div key={i} className="card p-3 text-center">
                      <s.icon size={16} className={clsx('mx-auto mb-1', s.color)} />
                      <p className="text-xs text-slate-500">{s.label}</p>
                      <p className={clsx('font-bold text-sm', s.color)}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Top categories */}
                <div className="card p-4">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm mb-3">Top Categories</p>
                  <div className="space-y-2">
                    {reportData.topCategories.map((cat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i%COLORS.length] }} />
                        <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">{cat.category}</span>
                        <span className="text-xs text-slate-400">{cat.percent}%</span>
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">₹{cat.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Recommendations preview */}
                {!aiLoading && recommendations.length > 0 && (
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={14} className="text-purple-500" />
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">AI Recommendations</p>
                    </div>
                    <div className="space-y-2">
                      {recommendations.map((rec, i) => (
                        <div key={i} className={clsx('rounded-xl p-3 border text-sm', {
                          'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800': rec.type === 'success',
                          'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800': rec.type === 'warning',
                          'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800':   rec.type === 'info',
                          'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800': rec.type === 'tip',
                        })}>
                          <p className="font-semibold text-slate-900 dark:text-white text-xs mb-0.5">
                            {rec.type === 'warning' ? '⚠️' : rec.type === 'success' ? '✅' : rec.type === 'info' ? 'ℹ️' : '💡'} {rec.title}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{rec.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setStep('config'); setReportData(null); setRecommendations([]) }}
                  className="btn-secondary flex items-center gap-2">
                  <RefreshCw size={14} /> Change Month
                </button>
                <button onClick={downloadPDF} disabled={aiLoading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Download size={16} />
                  {aiLoading ? 'Waiting for AI...' : 'Download PDF'}
                </button>
              </div>

              <p className="text-xs text-slate-400 text-center">
                💡 A print dialog will open. Select "Save as PDF" to download.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
