// frontend/src/components/income/IncomePage.jsx
import React, { useState } from 'react'
import { useIncomes } from '../../hooks/useIncomes'
import IncomeModal from './IncomeModal'
import { Plus, Trash2, Edit2, Loader2, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

const CATEGORY_COLORS = {
  Salary:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Freelance:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Business:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Investment: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Gift:       'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  Other:      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
}

export default function IncomePage() {
  const [modalOpen, setModalOpen]     = useState(false)
  const [editIncome, setEditIncome]   = useState(null)
  const [deletingId, setDeletingId]   = useState(null)
  const { incomes, loading, stats, add, edit, remove } = useIncomes()

  const fmt = (n) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(n)

  const handleDelete = async (id) => {
    if (!confirm('Delete this income entry?')) return
    setDeletingId(id)
    try { await remove(id) } finally { setDeletingId(null) }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Income</h1>
          <p className="text-slate-500 text-sm mt-1">
            {stats.count} source{stats.count !== 1 ? 's' : ''} · {fmt(stats.total)} total
          </p>
        </div>
        <button onClick={() => { setEditIncome(null); setModalOpen(true) }}
          className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} />
          Add Income
        </button>
      </div>

      {/* Stats card */}
      <div className="card p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
          <TrendingUp size={22} className="text-brand-500" />
        </div>
        <div>
          <p className="text-sm text-slate-500">Total Income</p>
          <p className="text-2xl font-bold font-display text-slate-900 dark:text-white">{fmt(stats.total)}</p>
        </div>
      </div>

      {/* Income list */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-brand-500" />
          </div>
        ) : incomes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-3">
              <TrendingUp size={24} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">No income added yet</p>
            <p className="text-sm text-slate-400 mt-1">Click "Add Income" to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {incomes.map(inc => (
              <div key={inc.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{inc.title}</p>
                    <span className={`badge text-xs ${CATEGORY_COLORS[inc.category] || CATEGORY_COLORS.Other}`}>
                      {inc.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs text-slate-400">{format(new Date(inc.date), 'dd MMM yyyy')}</p>
                    {inc.notes && <p className="text-xs text-slate-400 truncate max-w-xs">{inc.notes}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <p className="font-semibold font-mono text-brand-600 dark:text-brand-400 text-sm">
                    +{fmt(inc.amount)}
                  </p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditIncome(inc); setModalOpen(true) }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-700">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(inc.id)} disabled={deletingId === inc.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500">
                      {deletingId === inc.id
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

      {modalOpen && (
        <IncomeModal
          income={editIncome}
          onClose={() => setModalOpen(false)}
          onSave={async (data) => {
            if (editIncome) await edit(editIncome.id, data)
            else await add(data)
            setModalOpen(false)
          }}
        />
      )}
    </div>
  )
}