// src/components/dashboard/DashboardPage.jsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getExpenses, updateMe } from '../../services/api'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
  TrendingDown, TrendingUp, Wallet, PiggyBank,
  Edit2, Check, X, Loader2
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns'
import toast from 'react-hot-toast'
import AIInsights from './AIInsights'
import BudgetPrediction from './BudgetPrediction'

const COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899']

export default function DashboardPage() {
  const { dbUser, setDbUser } = useAuth()
  const [expenses, setExpenses]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [editBudget, setEditBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')
  const [savingBudget, setSavingBudget] = useState(false)

  const budget = parseFloat(dbUser?.monthly_budget || 0)

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const start = format(startOfMonth(new Date()), 'yyyy-MM-dd')
        const end   = format(endOfMonth(new Date()), 'yyyy-MM-dd')
        const { data } = await getExpenses({ start_date: start, end_date: end, limit: 500 })
        setExpenses(data.expenses || [])
      } catch (_) {}
      finally { setLoading(false) }
    }
    fetchExpenses()
  }, [])

  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0)
  const savings       = Math.max(0, budget - totalExpenses)
  const savingsPercent = budget > 0 ? Math.min(100, (savings / budget) * 100) : 0
  const spentPercent   = budget > 0 ? Math.min(100, (totalExpenses / budget) * 100) : 0

  // Category breakdown for pie
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount)
    return acc
  }, {})
  const pieData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  // Last 14 days area chart
  const areaData = Array.from({ length: 14 }, (_, i) => {
    const d   = subDays(new Date(), 13 - i)
    const day = format(d, 'MMM d')
    return {
      day,
      amount: expenses
        .filter(e => format(new Date(e.date), 'MMM d') === day)
        .reduce((s, e) => s + parseFloat(e.amount), 0)
    }
  })

  const handleSaveBudget = async () => {
    const val = parseFloat(budgetInput)
    if (isNaN(val) || val < 0) return toast.error('Invalid budget')
    setSavingBudget(true)
    try {
      const { data } = await updateMe({ monthly_budget: val })
      setDbUser(data.user)
      setEditBudget(false)
      toast.success('Budget updated!')
    } catch (_) {
      toast.error('Failed to update budget')
    } finally { setSavingBudget(false) }
  }

  const fmt = (n) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(n)

  const stats = [
    { label: 'Total Expenses', value: fmt(totalExpenses), icon: TrendingDown, color: 'text-red-500',   bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Monthly Budget', value: fmt(budget),        icon: TrendingUp,   color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-900/20' },
    { label: 'Savings',        value: fmt(savings),       icon: PiggyBank,    color: 'text-blue-500',  bg: 'bg-blue-50 dark:bg-blue-900/20', sub: `${savingsPercent.toFixed(0)}% of budget` },
    { label: 'Monthly Budget', value: fmt(budget),        icon: Wallet,       color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', editable: true },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">{format(new Date(), 'MMMM yyyy')} overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon size={20} className={s.color} />
              </div>
              {s.editable && !editBudget && (
                <button
                  onClick={() => { setEditBudget(true); setBudgetInput(String(budget)) }}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <Edit2 size={14} />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            {s.editable && editBudget ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number" value={budgetInput}
                  onChange={e => setBudgetInput(e.target.value)}
                  className="input-field py-1.5 text-sm w-full"
                />
                <button
                  onClick={handleSaveBudget} disabled={savingBudget}
                  className="p-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600"
                >
                  {savingBudget ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button onClick={() => setEditBudget(false)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <p className="text-xl font-bold font-display text-slate-900 dark:text-white">{s.value}</p>
            )}
            {s.sub && <p className="text-xs text-slate-400 mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Budget progress */}
      {budget > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-slate-900 dark:text-white text-sm">Budget Usage</p>
            <span className={`badge ${spentPercent > 90 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'}`}>
              {spentPercent.toFixed(0)}% spent
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${spentPercent > 90 ? 'bg-red-500' : spentPercent > 70 ? 'bg-amber-500' : 'bg-brand-500'}`}
              style={{ width: `${spentPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>{fmt(totalExpenses)} spent</span>
            <span>{fmt(Math.max(0, budget - totalExpenses))} remaining</span>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <p className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Daily Spending (Last 14 Days)</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={areaData} margin={{ top:5, right:5, bottom:5, left:0 }}>
              <defs>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize:11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize:11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={(v) => [`₹${v.toFixed(0)}`, 'Amount']} />
              <Area type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} fill="url(#gradGreen)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <p className="font-semibold text-slate-900 dark:text-white text-sm mb-4">By Category</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`₹${v.toFixed(0)}`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white">₹{item.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">No expenses this month</div>
          )}
        </div>
      </div>

      {/* ⭐ NEW: AI Insights + Smart Prediction side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AIInsights
          expenses={expenses}
          budget={budget}
          income={budget}
        />
        <BudgetPrediction
          expenses={expenses}
          budget={budget}
        />
      </div>
    </div>
  )
}
