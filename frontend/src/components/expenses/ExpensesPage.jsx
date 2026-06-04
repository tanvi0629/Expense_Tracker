// src/components/expenses/ExpensesPage.jsx
import React, { useState } from 'react'
import { useExpenses } from '../../hooks/useExpenses'
import ExpenseModal from './ExpenseModal'
import {
  Plus, Download, Search, Filter, Trash2, Edit2,
  Loader2, SlidersHorizontal, ChevronDown
} from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

const CATEGORIES = ['All','Food','Transport','Shopping','Entertainment','Bills','Health','Education','Other']
const CATEGORY_COLORS = {
  Food: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Transport: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Shopping: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  Entertainment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Bills: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Health: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Education: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  Other: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
}

export default function ExpensesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const filters = {
    search: search || undefined,
    category: category !== 'All' ? category : undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  }

  const { expenses, loading, stats, add, edit, remove, download } = useExpenses(filters)

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    setDeletingId(id)
    try { await remove(id) } finally { setDeletingId(null) }
  }

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Expenses</h1>
          <p className="text-slate-500 text-sm mt-1">
            {stats.count} transaction{stats.count !== 1 ? 's' : ''} · {fmt(stats.total)} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={download} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={16} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button onClick={() => { setEditExpense(null); setModalOpen(true) }}
            className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} />
            <span className="hidden sm:inline">Add Expense</span>
          </button>
        </div>
      </div>

      {/* Search & filter bar */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search expenses…"
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={clsx('btn-secondary flex items-center gap-2 text-sm', showFilters && 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-700')}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700 animate-slide-up">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input-field">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field" />
            </div>
          </div>
        )}
      </div>

      {/* Expense list */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-brand-500" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-3">
              <Filter size={24} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">No expenses found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or add a new expense</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {expenses.map((exp) => (
              <div key={exp.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{exp.title}</p>
                    <span className={`badge text-xs ${CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.Other}`}>
                      {exp.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs text-slate-400">{format(new Date(exp.date), 'dd MMM yyyy')}</p>
                    {exp.notes && <p className="text-xs text-slate-400 truncate max-w-xs">{exp.notes}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <p className="font-semibold font-mono text-slate-900 dark:text-white text-sm">
                    {fmt(exp.amount)}
                  </p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditExpense(exp); setModalOpen(true) }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-700"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      disabled={deletingId === exp.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"
                    >
                      {deletingId === exp.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <ExpenseModal
          expense={editExpense}
          onClose={() => setModalOpen(false)}
          onSave={async (data) => {
            if (editExpense) {
              await edit(editExpense.id, data)
            } else {
              await add(data)
            }
            setModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
