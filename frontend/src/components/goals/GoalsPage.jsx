// src/components/goals/GoalsPage.jsx
import React, { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { Plus, Trash2, Edit2, Loader2, Target, PlusCircle, Trophy, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const EMOJIS  = ['🎯','💻','🏠','🚗','✈️','📱','💍','🎓','🏖️','💰','🛍️','🎮','⌚','📷','🏋️']
const COLORS  = [
  { name: 'brand',  label: 'Green',  bar: 'bg-brand-500',  bg: 'bg-brand-50 dark:bg-brand-900/20',  text: 'text-brand-600 dark:text-brand-400' },
  { name: 'blue',   label: 'Blue',   bar: 'bg-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',    text: 'text-blue-600 dark:text-blue-400' },
  { name: 'purple', label: 'Purple', bar: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20',text: 'text-purple-600 dark:text-purple-400' },
  { name: 'amber',  label: 'Gold',   bar: 'bg-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-600 dark:text-amber-400' },
  { name: 'red',    label: 'Red',    bar: 'bg-red-500',    bg: 'bg-red-50 dark:bg-red-900/20',      text: 'text-red-600 dark:text-red-400' },
  { name: 'pink',   label: 'Pink',   bar: 'bg-pink-500',   bg: 'bg-pink-50 dark:bg-pink-900/20',    text: 'text-pink-600 dark:text-pink-400' },
]

const getColor = (name) => COLORS.find(c => c.name === name) || COLORS[0]

function GoalModal({ goal, onClose, onSave }) {
  const isEdit = Boolean(goal)
  const [form, setForm] = useState({
    title: goal?.title || '', targetAmount: goal?.target_amount || '',
    currentAmount: goal?.current_amount || '0',
    emoji: goal?.emoji || '🎯', color: goal?.color || 'brand',
    deadline: goal?.deadline ? goal.deadline.split('T')[0] : ''
  })
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(f => ({...f, [k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.targetAmount) return
    setLoading(true)
    try { await onSave(form) } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md card shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-white">{isEdit ? 'Edit Goal' : 'New Savings Goal'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Emoji picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => set('emoji', e)}
                  className={clsx('w-9 h-9 rounded-xl text-lg transition-all', form.emoji === e ? 'bg-brand-100 dark:bg-brand-900/30 ring-2 ring-brand-500' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600')}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Goal Name</label>
            <input type="text" required value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. New Laptop" className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target (₹)</label>
              <input type="number" required min="1" value={form.targetAmount} onChange={e => set('targetAmount', e.target.value)}
                placeholder="80000" className="input-field font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Already Saved (₹)</label>
              <input type="number" min="0" value={form.currentAmount} onChange={e => set('currentAmount', e.target.value)}
                placeholder="0" className="input-field font-mono" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Deadline <span className="text-slate-400">(optional)</span></label>
            <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} className="input-field" />
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c.name} type="button" onClick={() => set('color', c.name)}
                  className={clsx('w-8 h-8 rounded-full transition-all', c.bar, form.color === c.name ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-70 hover:opacity-100')} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? 'Update' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddAmountModal({ goal, onClose, onAdd }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const color = getColor(goal.color)
  const remaining = parseFloat(goal.target_amount) - parseFloat(goal.current_amount)
  const fmt = (n) => `₹${parseFloat(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    setLoading(true)
    try { await onAdd(parseFloat(amount)) } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm card shadow-2xl animate-scale-in p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{goal.emoji}</span>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{goal.title}</p>
              <p className="text-xs text-slate-500">Remaining: {fmt(remaining)}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Add Amount (₹)</label>
            <input type="number" required min="1" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount to add" className="input-field font-mono text-lg" autoFocus />
          </div>
          <div className="flex gap-2">
            {[1000, 5000, 10000].map(preset => (
              <button key={preset} type="button" onClick={() => setAmount(String(preset))}
                className="flex-1 text-xs py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 font-medium">
                +₹{preset.toLocaleString()}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className={clsx('flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white transition-all', color.bar)}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              Add Money
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function GoalsPage() {
  const [goals, setGoals]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null) // 'create'|'edit'|'add'
  const [selected, setSelected] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/goals')
      setGoals(data.goals || [])
    } catch (_) {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleSave = async (formData) => {
    try {
      if (selected) {
        const { data } = await api.put(`/goals/${selected.id}`, {
          title: formData.title, target_amount: parseFloat(formData.targetAmount),
          current_amount: parseFloat(formData.currentAmount), emoji: formData.emoji,
          color: formData.color, deadline: formData.deadline || null
        })
        setGoals(prev => prev.map(g => g.id === selected.id ? data.goal : g))
        toast.success('Goal updated!')
      } else {
        const { data } = await api.post('/goals', formData)
        setGoals(prev => [data.goal, ...prev])
        toast.success('Goal created!')
      }
      setModal(null); setSelected(null)
    } catch (_) { toast.error('Failed to save goal') }
  }

  const handleAddAmount = async (amount) => {
    try {
      const { data } = await api.post(`/goals/${selected.id}/add`, { amount })
      setGoals(prev => prev.map(g => g.id === selected.id ? data.goal : g))
      if (data.goal.is_completed) toast.success('🎉 Goal completed! Congratulations!')
      else toast.success(`₹${amount.toLocaleString()} added!`)
      setModal(null); setSelected(null)
    } catch (_) { toast.error('Failed to add amount') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return
    setDeletingId(id)
    try {
      await api.delete(`/goals/${id}`)
      setGoals(prev => prev.filter(g => g.id !== id))
      toast.success('Goal deleted')
    } catch (_) { toast.error('Failed to delete') }
    finally { setDeletingId(null) }
  }

  const fmt = (n) => `₹${parseFloat(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  const active    = goals.filter(g => !g.is_completed)
  const completed = goals.filter(g => g.is_completed)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Savings Goals</h1>
          <p className="text-slate-500 text-sm mt-1">{active.length} active · {completed.length} completed</p>
        </div>
        <button onClick={() => { setSelected(null); setModal('create') }}
          className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> New Goal
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-brand-500" />
        </div>
      ) : goals.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-3 text-3xl">🎯</div>
          <p className="font-semibold text-slate-700 dark:text-slate-300">No savings goals yet</p>
          <p className="text-sm text-slate-400 mt-1">Start saving for something you love</p>
          <button onClick={() => { setSelected(null); setModal('create') }}
            className="btn-primary mt-4 flex items-center gap-2 text-sm">
            <Plus size={16} /> Create First Goal
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active goals */}
          {active.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {active.map(goal => {
                const color    = getColor(goal.color)
                const current  = parseFloat(goal.current_amount)
                const target   = parseFloat(goal.target_amount)
                const percent  = Math.min(100, Math.round((current/target)*100))
                const remaining = target - current
                const deadline  = goal.deadline ? new Date(goal.deadline) : null
                const daysLeft  = deadline ? Math.ceil((deadline - new Date()) / (1000*60*60*24)) : null

                return (
                  <div key={goal.id} className="card p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center text-2xl', color.bg)}>
                          {goal.emoji}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{goal.title}</p>
                          {deadline && (
                            <p className={clsx('text-xs mt-0.5', daysLeft < 30 ? 'text-red-500' : 'text-slate-400')}>
                              {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setSelected(goal); setModal('edit') }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(goal.id)} disabled={deletingId === goal.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500">
                          {deletingId === goal.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <p className={clsx('text-2xl font-bold font-display', color.text)}>{fmt(current)}</p>
                          <p className="text-xs text-slate-400">of {fmt(target)}</p>
                        </div>
                        <div className="text-right">
                          <p className={clsx('text-lg font-bold', color.text)}>{percent}%</p>
                          <p className="text-xs text-slate-400">{fmt(remaining)} left</p>
                        </div>
                      </div>

                      <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={clsx('h-full rounded-full transition-all duration-700', color.bar)}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Add money button */}
                    <button
                      onClick={() => { setSelected(goal); setModal('add') }}
                      className={clsx('w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-95', color.bar)}
                    >
                      <PlusCircle size={16} /> Add Money
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Completed goals */}
          {completed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} className="text-amber-500" />
                <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Completed Goals 🎉</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {completed.map(goal => (
                  <div key={goal.id} className="card p-4 opacity-75 flex items-center gap-3">
                    <span className="text-2xl">{goal.emoji}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{goal.title}</p>
                      <p className="text-xs text-brand-500">{fmt(goal.target_amount)} saved ✓</p>
                    </div>
                    <button onClick={() => handleDelete(goal.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(modal === 'create' || modal === 'edit') && (
        <GoalModal
          goal={modal === 'edit' ? selected : null}
          onClose={() => { setModal(null); setSelected(null) }}
          onSave={handleSave}
        />
      )}

      {modal === 'add' && selected && (
        <AddAmountModal
          goal={selected}
          onClose={() => { setModal(null); setSelected(null) }}
          onAdd={handleAddAmount}
        />
      )}
    </div>
  )
}
