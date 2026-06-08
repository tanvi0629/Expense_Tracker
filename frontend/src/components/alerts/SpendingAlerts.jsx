// src/components/alerts/SpendingAlerts.jsx
import React, { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { Bell, Plus, Trash2, Loader2, AlertTriangle, CheckCircle, XCircle, X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const CATEGORIES = ['Food','Transport','Shopping','Entertainment','Bills','Health','Education','Other']

const LEVEL_STYLES = {
  safe:     { bg: 'bg-brand-50 dark:bg-brand-900/20', border: 'border-brand-200 dark:border-brand-800', bar: 'bg-brand-500', icon: CheckCircle,     iconColor: 'text-brand-500', label: 'On Track' },
  warning:  { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', bar: 'bg-amber-500', icon: AlertTriangle,    iconColor: 'text-amber-500', label: 'Warning' },
  critical: { bg: 'bg-red-50 dark:bg-red-900/20',     border: 'border-red-100 dark:border-red-900',     bar: 'bg-red-500',   icon: AlertCircle,      iconColor: 'text-red-500',   label: 'Critical' },
  exceeded: { bg: 'bg-red-100 dark:bg-red-900/30',    border: 'border-red-300 dark:border-red-700',     bar: 'bg-red-600',   icon: XCircle,          iconColor: 'text-red-600',   label: 'Exceeded!' },
}

function SetBudgetModal({ onClose, onSave }) {
  const [category, setCategory] = useState('Food')
  const [budget, setBudget]     = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!budget || parseFloat(budget) <= 0) return
    setLoading(true)
    try { await onSave(category, parseFloat(budget)) } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm card shadow-2xl animate-scale-in p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900 dark:text-white">Set Category Budget</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input-field">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Monthly Budget (₹)</label>
            <input type="number" required min="1" value={budget} onChange={e => setBudget(e.target.value)}
              placeholder="e.g. 5000" className="input-field font-mono" autoFocus />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Set Budget
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SpendingAlerts() {
  const [alerts, setAlerts]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/alerts')
      setAlerts(data.alerts || [])
    } catch (_) {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleSetBudget = async (category, budget) => {
    try {
      await api.post('/alerts/budgets', { category, budget })
      toast.success(`Budget set for ${category}!`)
      setShowModal(false)
      fetch()
    } catch (_) { toast.error('Failed to set budget') }
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await api.delete(`/alerts/budgets/${id}`)
      setAlerts(prev => prev.filter(a => a.id !== id))
      toast.success('Budget removed')
    } catch (_) { toast.error('Failed to remove') }
    finally { setDeleting(null) }
  }

  const fmt = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`

  const critical = alerts.filter(a => a.level === 'exceeded' || a.level === 'critical')

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Spending Alerts</h1>
          <p className="text-slate-500 text-sm mt-1">Set budgets per category and get warned when overspending</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Set Budget
        </button>
      </div>

      {/* Critical alerts banner */}
      {critical.length > 0 && (
        <div className="card p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 animate-fade-in">
          <div className="flex items-start gap-3">
            <Bell size={18} className="text-red-500 mt-0.5 flex-shrink-0 animate-bounce" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300 text-sm">
                {critical.length} category budget{critical.length > 1 ? 's' : ''} need attention!
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                {critical.map(a => a.category).join(', ')} {critical.length > 1 ? 'are' : 'is'} at or over budget this month.
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-brand-500" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-3">
            <Bell size={24} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700 dark:text-slate-300">No category budgets set</p>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">
            Set a monthly budget for each spending category to get alerts when you're close to the limit
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 flex items-center gap-2 text-sm">
            <Plus size={16} /> Set First Budget
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const style = LEVEL_STYLES[alert.level] || LEVEL_STYLES.safe
            const Icon  = style.icon
            return (
              <div key={alert.id} className={clsx('card p-4 border', style.bg, style.border)}>
                <div className="flex items-center gap-3 mb-3">
                  <Icon size={18} className={clsx('flex-shrink-0', style.iconColor)} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{alert.category}</p>
                      <div className="flex items-center gap-2">
                        <span className={clsx('badge text-xs', style.bg, style.iconColor)}>{style.label}</span>
                        <button onClick={() => handleDelete(alert.id)} disabled={deleting === alert.id}
                          className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500">
                          {deleting === alert.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={clsx('h-full rounded-full transition-all duration-700', style.bar)}
                      style={{ width: `${Math.min(100, alert.percent)}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-slate-400">Budget</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{fmt(alert.budget)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400">Spent</p>
                    <p className={clsx('font-semibold', style.iconColor)}>{fmt(alert.spent)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400">{alert.level === 'exceeded' ? 'Over by' : 'Remaining'}</p>
                    <p className={clsx('font-semibold', alert.level === 'exceeded' ? 'text-red-500' : 'text-brand-500')}>
                      {alert.level === 'exceeded' ? fmt(alert.spent - alert.budget) : fmt(alert.remaining)}
                    </p>
                  </div>
                </div>

                {/* Alert message */}
                {(alert.level === 'warning' || alert.level === 'critical' || alert.level === 'exceeded') && (
                  <p className={clsx('text-xs mt-2 font-medium', style.iconColor)}>
                    {alert.level === 'exceeded'
                      ? `⚠️ You've exceeded your ${alert.category} budget by ${fmt(alert.spent - alert.budget)}!`
                      : alert.level === 'critical'
                      ? `🔴 ${alert.percent}% of ${alert.category} budget used — only ${fmt(alert.remaining)} left!`
                      : `⚡ ${alert.percent}% of ${alert.category} budget used — ${fmt(alert.remaining)} remaining.`
                    }
                  </p>
                )}
              </div>
            )
          })}

          <button onClick={() => setShowModal(true)}
            className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
            <Plus size={16} /> Add Another Category Budget
          </button>
        </div>
      )}

      {showModal && (
        <SetBudgetModal
          onClose={() => setShowModal(false)}
          onSave={handleSetBudget}
        />
      )}
    </div>
  )
}
