// src/components/expenses/ExpenseModal.jsx
import React, { useState, useEffect } from 'react'
import { X, Loader2, Sparkles, Camera } from 'lucide-react'
import { format } from 'date-fns'
import ReceiptUploader from '../receipts/ReceiptUploader'
import OCRReceiptScanner from '../receipts/OCRReceiptScanner'

const CATEGORIES = ['Food','Transport','Shopping','Entertainment','Bills','Health','Education','Other']

export default function ExpenseModal({ expense, prefillData, onClose, onSave }) {
  const isEdit = Boolean(expense)
  const [form, setForm] = useState({
    title: '', amount: '', category: 'Other',
    date: format(new Date(), 'yyyy-MM-dd'), notes: '',
  })
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [savedId, setSavedId]     = useState(expense?.id || null)
  const [receiptUrl, setReceiptUrl] = useState(expense?.receipt_url || null)
  const [showOCR, setShowOCR]     = useState(false)
  const [ocrHighlight, setOcrHighlight] = useState(false)

  useEffect(() => {
    if (expense) {
      setForm({
        title:    expense.title,
        amount:   expense.amount,
        category: expense.category,
        date:     format(new Date(expense.date), 'yyyy-MM-dd'),
        notes:    expense.notes || '',
      })
      setReceiptUrl(expense.receipt_url || null)
    } else if (prefillData) {
      // Pre-fill from voice or OCR
      setForm({
        title:    prefillData.title    || '',
        amount:   prefillData.amount   || '',
        category: prefillData.category || 'Other',
        date:     prefillData.date     || format(new Date(), 'yyyy-MM-dd'),
        notes:    prefillData.notes    || '',
      })
      setOcrHighlight(true)
      setTimeout(() => setOcrHighlight(false), 2500)
    }
  }, [expense, prefillData])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleOCRData = (data) => {
    setForm(prev => ({
      ...prev,
      title:    data.title    || prev.title,
      amount:   data.amount   || prev.amount,
      date:     data.date     || prev.date,
      category: data.category || prev.category,
      notes:    data.notes    || prev.notes,
    }))
    setShowOCR(false)
    setOcrHighlight(true)
    setTimeout(() => setOcrHighlight(false), 2500)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!form.title.trim()) return setError('Title is required')
    if (!form.amount || parseFloat(form.amount) <= 0) return setError('Enter a valid amount')
    setLoading(true)
    try {
      const saved = await onSave({ ...form, amount: parseFloat(form.amount) })
      if (saved?.id) setSavedId(saved.id)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-md card shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
            <h2 className="font-bold text-slate-900 dark:text-white">
              {isEdit ? 'Edit Expense' : 'Add Expense'}
            </h2>
            <div className="flex items-center gap-2">
              {!isEdit && (
                <button type="button" onClick={() => setShowOCR(true)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 font-medium transition-all">
                  <Camera size={13} /> Scan Receipt
                </button>
              )}
              <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {ocrHighlight && (
              <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl px-4 py-3 animate-fade-in">
                <Sparkles size={15} className="text-purple-500 flex-shrink-0" />
                <p className="text-sm text-purple-700 dark:text-purple-400 font-medium">
                  ✨ Form auto-filled! Review and confirm.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
              <input type="text" required value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Lunch at café"
                className={`input-field transition-all ${ocrHighlight && form.title ? 'ring-2 ring-purple-400' : ''}`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Amount (₹)</label>
                <input type="number" step="0.01" min="0.01" required value={form.amount}
                  onChange={e => set('amount', e.target.value)} placeholder="0.00"
                  className={`input-field font-mono ${ocrHighlight && form.amount ? 'ring-2 ring-purple-400' : ''}`} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
                <input type="date" required value={form.date} onChange={e => set('date', e.target.value)}
                  className={`input-field ${ocrHighlight ? 'ring-2 ring-purple-400' : ''}`} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className={`input-field ${ocrHighlight ? 'ring-2 ring-purple-400' : ''}`}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes <span className="text-slate-400">(optional)</span></label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="Any additional notes…" rows={2} className="input-field resize-none" />
            </div>

            {(savedId || isEdit) && (
              <ReceiptUploader expenseId={savedId || expense?.id}
                currentReceiptUrl={receiptUrl} onUpdate={setReceiptUrl} />
            )}
            {!savedId && !isEdit && (
              <p className="text-xs text-slate-400 text-center">💡 Save first, then attach a receipt photo</p>
            )}

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

      {showOCR && (
        <OCRReceiptScanner onDataExtracted={handleOCRData} onClose={() => setShowOCR(false)} />
      )}
    </>
  )
}
