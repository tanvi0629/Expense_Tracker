// src/components/dashboard/BudgetPrediction.jsx
import React, { useMemo } from 'react'
import { TrendingUp, TrendingDown, Calendar, Target, Zap } from 'lucide-react'
import clsx from 'clsx'

export default function BudgetPrediction({ expenses, budget }) {
  const stats = useMemo(() => {
    if (!expenses?.length) return null

    const now         = new Date()
    const dayOfMonth  = now.getDate()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysLeft    = daysInMonth - dayOfMonth

    const totalSpent  = expenses.reduce((s, e) => s + parseFloat(e.amount), 0)
    const dailyAvg    = totalSpent / dayOfMonth
    const predicted   = Math.round(dailyAvg * daysInMonth)
    const predictedLeft = Math.round(dailyAvg * daysLeft)

    const budgetStatus = budget
      ? predicted > budget ? 'over' : predicted > budget * 0.8 ? 'warning' : 'safe'
      : null

    const savedVsPredicted = budget ? budget - predicted : null
    const progressPercent  = budget ? Math.min(100, (predicted / budget) * 100) : 0

    // Category predictions
    const categoryTotals = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount)
      return acc
    }, {})

    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amt]) => ({
        category: cat,
        currentSpend: Math.round(amt),
        predictedMonthEnd: Math.round((amt / dayOfMonth) * daysInMonth),
      }))

    return {
      totalSpent: Math.round(totalSpent),
      dailyAvg:   Math.round(dailyAvg),
      predicted,
      predictedLeft,
      daysLeft,
      dayOfMonth,
      daysInMonth,
      budgetStatus,
      savedVsPredicted,
      progressPercent,
      topCategories,
    }
  }, [expenses, budget])

  const fmt = (n) => `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

  if (!stats) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Target size={16} className="text-blue-500" />
          </div>
          <p className="font-semibold text-slate-900 dark:text-white text-sm">Smart Budget Prediction</p>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-slate-400 text-sm">Add expenses to see predictions</p>
        </div>
      </div>
    )
  }

  const statusColors = {
    safe:    { bar: 'bg-brand-500', text: 'text-brand-600 dark:text-brand-400', badge: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' },
    warning: { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    over:    { bar: 'bg-red-500',   text: 'text-red-600 dark:text-red-400',     badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    null:    { bar: 'bg-blue-500',  text: 'text-blue-600 dark:text-blue-400',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  }

  const colors = statusColors[stats.budgetStatus] || statusColors.null

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Target size={16} className="text-blue-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">Smart Budget Prediction</p>
            <p className="text-xs text-slate-500">Based on your spending pattern</p>
          </div>
        </div>
        <span className={clsx('badge text-xs', colors.badge)}>
          {stats.dayOfMonth}/{stats.daysInMonth} days
        </span>
      </div>

      {/* Main prediction */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
          <p className="text-xs text-slate-500 mb-1">Current Spend</p>
          <p className="text-xl font-bold font-display text-slate-900 dark:text-white">
            {fmt(stats.totalSpent)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">this month so far</p>
        </div>

        <div className={clsx('rounded-xl p-3', colors.badge)}>
          <p className="text-xs opacity-70 mb-1">Predicted Month End</p>
          <p className={clsx('text-xl font-bold font-display', colors.text)}>
            {fmt(stats.predicted)}
          </p>
          <p className="text-xs opacity-70 mt-0.5">at current rate</p>
        </div>
      </div>

      {/* Progress bar vs budget */}
      {budget > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500">Predicted vs Budget</p>
            <p className={clsx('text-xs font-semibold', colors.text)}>
              {stats.progressPercent.toFixed(0)}% of budget
            </p>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all duration-700', colors.bar)}
              style={{ width: `${Math.min(100, stats.progressPercent)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-slate-400">
            <span>Budget: {fmt(budget)}</span>
            <span className={clsx('font-medium', colors.text)}>
              {stats.savedVsPredicted >= 0
                ? `${fmt(stats.savedVsPredicted)} under budget`
                : `${fmt(Math.abs(stats.savedVsPredicted))} over budget`
              }
            </span>
          </div>
        </div>
      )}

      {/* Daily stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5">
          <p className="text-xs text-slate-500 mb-0.5">Daily Avg</p>
          <p className="font-bold text-slate-900 dark:text-white text-sm">{fmt(stats.dailyAvg)}</p>
        </div>
        <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5">
          <p className="text-xs text-slate-500 mb-0.5">Days Left</p>
          <p className="font-bold text-slate-900 dark:text-white text-sm">{stats.daysLeft}</p>
        </div>
        <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5">
          <p className="text-xs text-slate-500 mb-0.5">Still to Spend</p>
          <p className={clsx('font-bold text-sm', colors.text)}>{fmt(stats.predictedLeft)}</p>
        </div>
      </div>

      {/* Top category predictions */}
      {stats.topCategories.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
            <Zap size={11} /> Category Predictions
          </p>
          <div className="space-y-2">
            {stats.topCategories.map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={clsx('w-1.5 h-1.5 rounded-full', colors.bar)} />
                  <span className="text-slate-600 dark:text-slate-400">{cat.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{fmt(cat.currentSpend)} now</span>
                  <span className="text-slate-300 dark:text-slate-600">→</span>
                  <span className={clsx('font-medium', colors.text)}>{fmt(cat.predictedMonthEnd)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart tip */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <p className="text-xs text-slate-500 flex items-start gap-1.5">
          <Calendar size={11} className="mt-0.5 flex-shrink-0" />
          {stats.budgetStatus === 'over'
            ? `⚠️ At this rate you'll exceed budget by ${fmt(Math.abs(stats.savedVsPredicted))}. Reduce daily spend to ${fmt(budget / stats.daysInMonth)}/day.`
            : stats.budgetStatus === 'warning'
            ? `⚡ You're on track but close to budget. Try to keep daily spend under ${fmt((budget - stats.totalSpent) / stats.daysLeft)}.`
            : budget > 0
            ? `✅ Great! You're on track to save ${fmt(stats.savedVsPredicted)} this month.`
            : `📊 You're spending an average of ${fmt(stats.dailyAvg)}/day. Set a budget to see predictions.`
          }
        </p>
      </div>
    </div>
  )
}
