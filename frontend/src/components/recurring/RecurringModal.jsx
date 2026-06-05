// src/components/recurring/RecurringModal.jsx
import React, { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

const CATEGORIES  = ['Food','Transport','Shopping','Entertainment','Bills','Health','Education','Other']
const FREQUENCIES = [
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly' },
]

export default function RecurringModal({ item, onClose, onSave }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState({
    title: '', amount: '', category: 'Bills',
    frequency: 'monthly',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (item) setForm({
      title: item.title, amount: item.amount,
      category: item.category, frequency: item.frequency,
      startDate: format(new Date(item.start_date), 'yyyy-MM-dd'),
      notes: item.notes || ''
    })
  }, [item])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!form.title.trim()) return setError('Title is required')
    if (!form.amount || parseFloat(form.amount) <= 0) return setError('Enter a valid amount')
    setLoading(true)
    try {
      await onSave({ ...form, amount: parseFloat(form.amount) })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md card shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-white">
            {isEdit ? 'Edit Recurring' : 'Add Recurring Expense'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
            <input type="text" required value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Netflix Subscription" className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Amount (₹)</label>
              <input type="number" step="0.01" min="0.01" required value={form.amount}
                onChange={e => set('amount', e.target.value)} placeholder="0.00" className="input-field font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Frequency</label>
              <select value={form.frequency} onChange={e => set('frequency', e.target.value)} className="input-field">
                {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Start Date</label>
              <input type="date" required value={form.startDate} onChange={e => set('startDate', e.target.value)} className="input-field" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes <span className="text-slate-400">(optional)</span></label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Any notes..." rows={2} className="input-field resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
