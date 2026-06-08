// src/components/dashboard/AIInsights.jsx
import React, { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, TrendingDown, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

const SYSTEM_PROMPT = `You are Penny, an AI financial analyst for Spendly expense tracker app.
Analyze the user's spending data and provide exactly 3-4 specific, actionable insights.

Format your response as JSON array only, no other text:
[
  {
    "type": "warning|success|tip|alert",
    "title": "Short title (5 words max)",
    "message": "Specific insight with exact numbers from the data (1-2 sentences)",
    "saving": "Optional: specific saving amount like ₹2,400"
  }
]

Rules:
- Use EXACT numbers from the data provided
- Be specific, not generic
- type "warning" = overspending, "success" = doing well, "tip" = suggestion, "alert" = urgent
- Always mention category names and rupee amounts
- Compare with previous period if data available
- Keep each message under 20 words`

async function getAIInsights(expenseData, apiKey) {
  const url = `https://api.groq.com/openai/v1/chat/completions`

  const userMessage = `Analyze this spending data and give insights:
${JSON.stringify(expenseData, null, 2)}

Return ONLY a JSON array, no other text.`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 500,
      temperature: 0.3,
    })
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || 'API error')

  const text = data.choices?.[0]?.message?.content || '[]'
  // Extract JSON from response
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Invalid response format')
  return JSON.parse(match[0])
}

const TYPE_STYLES = {
  warning: {
    bg:   'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon: TrendingUp,
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-800 dark:text-amber-300',
  },
  alert: {
    bg:   'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: AlertCircle,
    iconColor: 'text-red-500',
    titleColor: 'text-red-800 dark:text-red-300',
  },
  success: {
    bg:   'bg-brand-50 dark:bg-brand-900/20',
    border: 'border-brand-200 dark:border-brand-800',
    icon: TrendingDown,
    iconColor: 'text-brand-500',
    titleColor: 'text-brand-800 dark:text-brand-300',
  },
  tip: {
    bg:   'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Sparkles,
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-800 dark:text-blue-300',
  },
}

export default function AIInsights({ expenses, budget, income }) {
  const [insights, setInsights] = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [generated, setGenerated] = useState(false)

  const generateInsights = async () => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY
    if (!apiKey) {
      setError('Add VITE_GROQ_API_KEY to frontend .env to enable AI insights')
      return
    }
    if (!expenses?.length) {
      setError('Add some expenses first to get AI insights')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Build category totals
      const categoryTotals = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount)
        return acc
      }, {})

      const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0)
      const topCategory   = Object.entries(categoryTotals).sort((a,b) => b[1]-a[1])[0]

      // Days elapsed this month
      const now       = new Date()
      const dayOfMonth = now.getDate()
      const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()
      const dailyAvg  = totalExpenses / dayOfMonth
      const projected = dailyAvg * daysInMonth

      const expenseData = {
        currentMonth: {
          totalExpenses:    Math.round(totalExpenses),
          budget:           budget || 0,
          income:           income || 0,
          savings:          Math.max(0, (income || 0) - totalExpenses),
          budgetUsedPercent: budget ? Math.round((totalExpenses/budget)*100) : 0,
          transactionCount: expenses.length,
          topCategory:      topCategory ? { name: topCategory[0], amount: Math.round(topCategory[1]) } : null,
          projectedSpend:   Math.round(projected),
          dailyAvgSpend:    Math.round(dailyAvg),
          daysElapsed:      dayOfMonth,
          daysInMonth,
        },
        categoryBreakdown: Object.entries(categoryTotals)
          .sort((a,b) => b[1]-a[1])
          .map(([cat, amt]) => ({ category: cat, amount: Math.round(amt), percent: Math.round((amt/totalExpenses)*100) })),
        recentExpenses: expenses.slice(0,5).map(e => ({
          title: e.title, amount: parseFloat(e.amount), category: e.category
        })),
      }

      const result = await getAIInsights(expenseData, apiKey)
      setInsights(result)
      setGenerated(true)
    } catch (err) {
      console.error('AI Insights error:', err)
      setError('Failed to generate insights. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Sparkles size={16} className="text-purple-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">AI Expense Insights</p>
            <p className="text-xs text-slate-500">Powered by Penny AI</p>
          </div>
        </div>
        <button
          onClick={generateInsights}
          disabled={loading}
          className={clsx(
            'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all',
            loading
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-400'
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          )}
        >
          {loading
            ? <Loader2 size={13} className="animate-spin" />
            : <RefreshCw size={13} />
          }
          {loading ? 'Analyzing...' : generated ? 'Refresh' : 'Analyze'}
        </button>
      </div>

      {/* Content */}
      {!generated && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-3">
            <Sparkles size={24} className="text-purple-500" />
          </div>
          <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">Get AI-powered insights</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Click Analyze to get personalized spending insights based on your current month data
          </p>
          <button onClick={generateInsights} className="mt-4 btn-primary text-sm flex items-center gap-2">
            <Sparkles size={14} /> Analyze My Spending
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 size={28} className="animate-spin text-purple-500" />
          <p className="text-sm text-slate-500">Penny is analyzing your spending...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((insight, i) => {
            const style = TYPE_STYLES[insight.type] || TYPE_STYLES.tip
            const Icon  = style.icon
            return (
              <div key={i} className={clsx('rounded-xl p-3 border', style.bg, style.border)}>
                <div className="flex items-start gap-2.5">
                  <Icon size={16} className={clsx('mt-0.5 flex-shrink-0', style.iconColor)} />
                  <div className="flex-1">
                    <p className={clsx('font-semibold text-xs mb-0.5', style.titleColor)}>
                      {insight.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {insight.message}
                    </p>
                    {insight.saving && (
                      <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-1">
                        💰 Potential saving: {insight.saving}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
