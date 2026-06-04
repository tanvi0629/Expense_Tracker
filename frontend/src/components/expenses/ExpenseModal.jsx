// src/components/expenses/ExpenseModal.jsx
import React, { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

const CATEGORIES = ['Food','Transport','Shopping','Entertainment','Bills','Health','Education','Other']

export default function ExpenseModal({ expense, onClose, onSave }) {
  const isEdit = Boolean(expense)
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Other',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        date: format(new Date(expense.date), 'yyyy-MM-dd'),
        notes: expense.notes || '',
      })
    }
  }, [expense])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!form.title.trim()) return setError('Title is required')
    if (!form.amount || parseFloat(form.amount) <= 0) return setError('Enter a valid amount')
    setLoading(true)
    try {
      await onSave({ ...form, amount: parseFloat(form.amount) })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md card shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-white">{isEdit ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
            <input
              type="text" required value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Lunch at café" className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Amount (₹)</label>
              <input
                type="number" step="0.01" min="0.01" required value={form.amount}
                onChange={e => set('amount', e.target.value)}
                placeholder="0.00" className="input-field font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
              <input
                type="date" required value={form.date} onChange={e => set('date', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes <span className="text-slate-400">(optional)</span></label>
            <textarea
              value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Any additional notes…" rows={2}
              className="input-field resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Saving…' : isEdit ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
