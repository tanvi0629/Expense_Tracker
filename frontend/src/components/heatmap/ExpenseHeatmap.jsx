// src/components/heatmap/ExpenseHeatmap.jsx
import React, { useState, useEffect, useMemo } from 'react'
import api from '../../services/api'
import { format, startOfYear, eachDayOfInterval, getDay, getWeek, parseISO, subYears } from 'date-fns'
import { Loader2, Calendar, TrendingDown, TrendingUp, Flame } from 'lucide-react'
import clsx from 'clsx'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// Color intensity levels (like GitHub)
function getIntensityClass(amount, max) {
  if (!amount || amount === 0) return 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
  const ratio = amount / max
  if (ratio <= 0.15) return 'bg-brand-100 dark:bg-brand-900/40 border border-brand-200 dark:border-brand-800'
  if (ratio <= 0.35) return 'bg-brand-200 dark:bg-brand-800/60 border border-brand-300 dark:border-brand-700'
  if (ratio <= 0.60) return 'bg-brand-300 dark:bg-brand-700/70 border border-brand-400 dark:border-brand-600'
  if (ratio <= 0.80) return 'bg-brand-400 dark:bg-brand-600/80 border border-brand-500'
  return 'bg-brand-500 dark:bg-brand-500 border border-brand-600'
}

function getIntensityLabel(amount, max) {
  if (!amount) return 'No spending'
  const ratio = amount / max
  if (ratio <= 0.15) return 'Low spending'
  if (ratio <= 0.35) return 'Moderate spending'
  if (ratio <= 0.60) return 'High spending'
  if (ratio <= 0.80) return 'Very high spending'
  return 'Peak spending'
}

export default function ExpenseHeatmap() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tooltip, setTooltip]   = useState(null)
  const [year, setYear]         = useState(new Date().getFullYear())

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/expenses', {
          params: {
            start_date: `${year}-01-01`,
            end_date:   `${year}-12-31`,
            limit: 1000
          }
        })
        setExpenses(data.expenses || [])
      } catch (_) {}
      finally { setLoading(false) }
    }
    fetchAll()
  }, [year])

  const { dailyMap, maxAmount, stats, weeks } = useMemo(() => {
    // Build daily spending map
    const dailyMap = {}
    for (const exp of expenses) {
      const day = exp.date.split('T')[0]
      dailyMap[day] = (dailyMap[day] || 0) + parseFloat(exp.amount)
    }

    const amounts   = Object.values(dailyMap)
    const maxAmount = amounts.length ? Math.max(...amounts) : 1

    // Build stats
    const totalSpend  = amounts.reduce((s, a) => s + a, 0)
    const activeDays  = amounts.filter(a => a > 0).length
    const avgPerDay   = activeDays ? totalSpend / activeDays : 0
    const bestDay     = Object.entries(dailyMap).sort((a,b) => b[1]-a[1])[0]
    const streakDays  = calcStreak(dailyMap)

    // Build weeks grid for the year
    const yearStart = new Date(year, 0, 1)
    const yearEnd   = new Date(year, 11, 31)
    const allDays   = eachDayOfInterval({ start: yearStart, end: yearEnd })

    // Pad start so week starts on Sunday
    const firstDayOfWeek = getDay(yearStart)
    const paddedDays = [
      ...Array(firstDayOfWeek).fill(null),
      ...allDays
    ]

    // Group into weeks of 7
    const weeks = []
    for (let i = 0; i < paddedDays.length; i += 7) {
      weeks.push(paddedDays.slice(i, i + 7))
    }

    return {
      dailyMap,
      maxAmount,
      stats: { totalSpend, activeDays, avgPerDay, bestDay, streakDays },
      weeks,
    }
  }, [expenses, year])

  function calcStreak(dailyMap) {
    let streak = 0
    let current = new Date()
    while (true) {
      const key = format(current, 'yyyy-MM-dd')
      if (dailyMap[key]) { streak++; current.setDate(current.getDate() - 1) }
      else break
    }
    return streak
  }

  const fmt = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`

  // Month label positions
  const monthLabels = useMemo(() => {
    const labels = []
    let lastMonth = -1
    weeks.forEach((week, wi) => {
      const firstReal = week.find(d => d !== null)
      if (firstReal) {
        const m = firstReal.getMonth()
        if (m !== lastMonth) { labels.push({ week: wi, month: m }); lastMonth = m }
      }
    })
    return labels
  }, [weeks])

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Expense Heatmap</h1>
          <p className="text-slate-500 text-sm mt-1">Spending intensity throughout the year</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(y => y-1)} className="btn-secondary px-3 py-2 text-sm">← {year-1}</button>
          <span className="font-bold text-slate-900 dark:text-white px-2">{year}</span>
          <button
            onClick={() => setYear(y => y+1)}
            disabled={year >= new Date().getFullYear()}
            className="btn-secondary px-3 py-2 text-sm disabled:opacity-40"
          >{year+1} →</button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: TrendingDown, label: 'Total Spent',   value: fmt(stats.totalSpend),          color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20' },
          { icon: Calendar,     label: 'Active Days',   value: `${stats.activeDays} days`,      color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { icon: TrendingUp,   label: 'Avg Spend/Day', value: fmt(stats.avgPerDay),            color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { icon: Flame,        label: 'Current Streak', value: `${stats.streakDays} day${stats.streakDays !== 1 ? 's' : ''}`, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-900/20' },
        ].map((s,i) => (
          <div key={i} className="card p-4">
            <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center mb-2', s.bg)}>
              <s.icon size={16} className={s.color} />
            </div>
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="card p-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Month labels */}
            <div className="flex ml-8 gap-0 overflow-x-auto">
              <div className="flex" style={{ gap: '3px' }}>
                {weeks.map((_, wi) => {
                  const label = monthLabels.find(l => l.week === wi)
                  return (
                    <div key={wi} style={{ width: '13px', flexShrink: 0 }}>
                      {label && (
                        <span className="text-xs text-slate-400 whitespace-nowrap" style={{ fontSize: '10px' }}>
                          {MONTHS[label.month]}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Grid */}
            <div className="flex gap-1 overflow-x-auto pb-2">
              {/* Day labels */}
              <div className="flex flex-col justify-between mr-1 flex-shrink-0" style={{ gap: '3px' }}>
                {DAYS.map((day, i) => (
                  <div key={day} style={{ height: '13px', fontSize: '9px' }}
                    className="text-slate-400 flex items-center">
                    {i % 2 === 1 ? day : ''}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              <div className="flex" style={{ gap: '3px' }}>
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col" style={{ gap: '3px' }}>
                    {week.map((day, di) => {
                      if (!day) return <div key={di} style={{ width:'13px', height:'13px' }} />
                      const key    = format(day, 'yyyy-MM-dd')
                      const amount = dailyMap[key] || 0
                      const isToday = key === format(new Date(), 'yyyy-MM-dd')

                      return (
                        <div
                          key={di}
                          style={{ width:'13px', height:'13px', borderRadius:'2px', cursor: amount ? 'pointer' : 'default', position:'relative' }}
                          className={clsx(
                            'transition-transform hover:scale-125',
                            getIntensityClass(amount, maxAmount),
                            isToday && 'ring-1 ring-brand-500'
                          )}
                          onMouseEnter={(e) => setTooltip({
                            x: e.clientX, y: e.clientY,
                            date: format(day, 'EEEE, dd MMM yyyy'),
                            amount, label: getIntensityLabel(amount, maxAmount)
                          })}
                          onMouseLeave={() => setTooltip(null)}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs text-slate-400">Less</span>
              {['bg-slate-100 dark:bg-slate-800','bg-brand-100 dark:bg-brand-900/40','bg-brand-200 dark:bg-brand-800/60','bg-brand-300 dark:bg-brand-700/70','bg-brand-400 dark:bg-brand-600/80','bg-brand-500 dark:bg-brand-500'].map((cls, i) => (
                <div key={i} style={{ width:'13px', height:'13px', borderRadius:'2px' }} className={cls} />
              ))}
              <span className="text-xs text-slate-400">More</span>
            </div>
          </div>
        )}
      </div>

      {/* Best spending day */}
      {stats.bestDay && (
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <Flame size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Peak Spending Day</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {format(parseISO(stats.bestDay[0]), 'EEEE, dd MMMM yyyy')} — {fmt(stats.bestDay[1])}
            </p>
          </div>
        </div>
      )}

      {/* Monthly breakdown */}
      <MonthlyBreakdown expenses={expenses} year={year} />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-xl px-3 py-2 pointer-events-none shadow-lg"
          style={{ left: tooltip.x + 10, top: tooltip.y - 40 }}
        >
          <p className="font-semibold">{tooltip.date}</p>
          <p className="text-slate-300">{tooltip.amount ? fmt(tooltip.amount) : 'No spending'}</p>
          <p className="text-slate-400">{tooltip.label}</p>
        </div>
      )}
    </div>
  )
}

function MonthlyBreakdown({ expenses, year }) {
  const monthlyData = useMemo(() => {
    const map = Array(12).fill(0)
    for (const exp of expenses) {
      const m = new Date(exp.date).getMonth()
      map[m] += parseFloat(exp.amount)
    }
    const max = Math.max(...map, 1)
    return map.map((total, i) => ({ month: MONTHS[i], total, percent: (total/max)*100 }))
  }, [expenses])

  const fmt = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`

  return (
    <div className="card p-5">
      <p className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Monthly Breakdown {year}</p>
      <div className="space-y-2">
        {monthlyData.map((m, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-slate-400 w-7 text-right">{m.month}</span>
            <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${Math.max(m.percent, m.total > 0 ? 3 : 0)}%` }}
              >
                {m.percent > 20 && (
                  <span className="text-white text-xs font-medium">{fmt(m.total)}</span>
                )}
              </div>
            </div>
            {m.percent <= 20 && (
              <span className="text-xs text-slate-500 w-20 text-right">{m.total > 0 ? fmt(m.total) : '—'}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
