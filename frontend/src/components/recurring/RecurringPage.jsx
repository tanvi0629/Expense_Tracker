// // frontend/src/components/recurring/RecurringPage.jsx
// import React, { useState, useEffect } from 'react'
// import { Plus, Trash2, Edit2, Loader2, RefreshCw, Power } from 'lucide-react'
// import { format } from 'date-fns'
// import api from '../../services/api'
// import { useCurrency } from '../../context/CurrencyContext'
// import toast from 'react-hot-toast'
// import clsx from 'clsx'

// const CATEGORIES  = ['Food','Transport','Shopping','Entertainment','Bills','Health','Education','Other']
// const FREQUENCIES = ['daily','weekly','monthly','yearly']
// const FREQ_COLORS = {
//   daily:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
//   weekly:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
//   monthly: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
//   yearly:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
// }

// const EMPTY_FORM = {
//   title: '', amount: '', category: 'Bills',
//   frequency: 'monthly', start_date: format(new Date(), 'yyyy-MM-dd'), notes: ''
// }

// export default function RecurringPage() {
//   const { format: fmt } = useCurrency()
//   const [recurring, setRecurring] = useState([])
//   const [loading, setLoading]     = useState(true)
//   const [modalOpen, setModalOpen] = useState(false)
//   const [editItem, setEditItem]   = useState(null)
//   const [form, setForm]           = useState(EMPTY_FORM)
//   const [saving, setSaving]       = useState(false)
//   const [processing, setProcessing] = useState(false)

//   const loadRecurring = async () => {
//     setLoading(true)
//     try {
//       const { data } = await api.get('/recurring')
//       setRecurring(data.recurring || [])
//     } catch (_) { toast.error('Failed to load recurring expenses') }
//     finally { setLoading(false) }
//   }

//   useEffect(() => { loadRecurring() }, [])

//   const openAdd  = () => { setEditItem(null); setForm(EMPTY_FORM); setModalOpen(true) }
//   const openEdit = (item) => {
//     setEditItem(item)
//     setForm({
//       title: item.title, amount: item.amount, category: item.category,
//       frequency: item.frequency, start_date: format(new Date(item.start_date), 'yyyy-MM-dd'),
//       notes: item.notes || ''
//     })
//     setModalOpen(true)
//   }

//   const handleSave = async (e) => {
//     e.preventDefault()
//     setSaving(true)
//     try {
//       if (editItem) {
//         const { data } = await api.put(`/recurring/${editItem.id}`, form)
//         setRecurring(prev => prev.map(r => r.id === editItem.id ? data.recurring : r))
//         toast.success('Updated!')
//       } else {
//         const { data } = await api.post('/recurring', form)
//         setRecurring(prev => [data.recurring, ...prev])
//         toast.success('Recurring expense added!')
//       }
//       setModalOpen(false)
//     } catch (err) {
//       toast.error(err.response?.data?.message || 'Failed to save')
//     } finally { setSaving(false) }
//   }

//   const handleDelete = async (id) => {
//     if (!confirm('Delete this recurring expense?')) return
//     try {
//       await api.delete(`/recurring/${id}`)
//       setRecurring(prev => prev.filter(r => r.id !== id))
//       toast.success('Deleted')
//     } catch (_) { toast.error('Failed to delete') }
//   }

//   const handleToggle = async (item) => {
//     try {
//       const { data } = await api.put(`/recurring/${item.id}`, { is_active: !item.is_active })
//       setRecurring(prev => prev.map(r => r.id === item.id ? data.recurring : r))
//       toast.success(data.recurring.is_active ? 'Activated' : 'Paused')
//     } catch (_) { toast.error('Failed to update') }
//   }

//   const handleProcess = async () => {
//     setProcessing(true)
//     try {
//       const { data } = await api.post('/recurring/process')
//       toast.success(`Processed ${data.processed} recurring expense(s)`)
//       loadRecurring()
//     } catch (_) { toast.error('Failed to process') }
//     finally { setProcessing(false) }
//   }

//   const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

//   return (
//     <div className="space-y-5 animate-fade-in">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recurring Expenses</h1>
//           <p className="text-slate-500 text-sm mt-1">{recurring.length} recurring expense{recurring.length !== 1 ? 's' : ''}</p>
//         </div>
//         <div className="flex items-center gap-2">
//           <button onClick={handleProcess} disabled={processing}
//             className="btn-secondary flex items-center gap-2 text-sm">
//             {processing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
//             Process Due
//           </button>
//           <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
//             <Plus size={16} /> Add Recurring
//           </button>
//         </div>
//       </div>

//       <div className="card overflow-hidden">
//         {loading ? (
//           <div className="flex items-center justify-center py-16">
//             <Loader2 size={28} className="animate-spin text-brand-500" />
//           </div>
//         ) : recurring.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-16 text-center">
//             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-3">
//               <RefreshCw size={24} className="text-slate-400" />
//             </div>
//             <p className="font-semibold text-slate-700 dark:text-slate-300">No recurring expenses</p>
//             <p className="text-sm text-slate-400 mt-1">Add bills, subscriptions, or regular payments</p>
//           </div>
//         ) : (
//           <div className="divide-y divide-slate-100 dark:divide-slate-700">
//             {recurring.map(item => (
//               <div key={item.id}
//                 className={clsx('flex items-center gap-4 px-5 py-4 group transition-colors',
//                   item.is_active
//                     ? 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
//                     : 'opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700/30'
//                 )}>
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 flex-wrap">
//                     <p className="font-medium text-slate-900 dark:text-white text-sm">{item.title}</p>
//                     <span className={`badge text-xs ${FREQ_COLORS[item.frequency]}`}>
//                       {item.frequency}
//                     </span>
//                     <span className="badge text-xs bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
//                       {item.category}
//                     </span>
//                     {!item.is_active && (
//                       <span className="badge text-xs bg-slate-100 text-slate-500">paused</span>
//                     )}
//                   </div>
//                   <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
//                     <span>Next due: {item.next_due ? format(new Date(item.next_due), 'dd MMM yyyy') : 'N/A'}</span>
//                     {item.notes && <span className="truncate max-w-xs">{item.notes}</span>}
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <p className="font-semibold font-mono text-slate-900 dark:text-white text-sm">{fmt(item.amount)}</p>
//                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                     <button onClick={() => handleToggle(item)}
//                       className={clsx('p-1.5 rounded-lg transition-colors',
//                         item.is_active
//                           ? 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-500'
//                           : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-slate-400 hover:text-green-500'
//                       )}>
//                       <Power size={14} />
//                     </button>
//                     <button onClick={() => openEdit(item)}
//                       className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-700">
//                       <Edit2 size={14} />
//                     </button>
//                     <button onClick={() => handleDelete(item.id)}
//                       className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500">
//                       <Trash2 size={14} />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Modal */}
//       {modalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
//           <div className="w-full max-w-md card shadow-2xl animate-scale-in">
//             <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
//               <h2 className="font-bold text-slate-900 dark:text-white">
//                 {editItem ? 'Edit Recurring' : 'Add Recurring Expense'}
//               </h2>
//               <button onClick={() => setModalOpen(false)} className="btn-ghost p-1.5">✕</button>
//             </div>
//             <form onSubmit={handleSave} className="p-6 space-y-4">
//               <div className="space-y-1">
//                 <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
//                 <input type="text" required value={form.title} onChange={e => set('title', e.target.value)}
//                   placeholder="e.g. Netflix, Rent, EMI" className="input-field" />
//               </div>
//               <div className="grid grid-cols-2 gap-3">
//                 <div className="space-y-1">
//                   <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Amount</label>
//                   <input type="number" step="0.01" min="0.01" required value={form.amount}
//                     onChange={e => set('amount', e.target.value)} placeholder="0.00" className="input-field font-mono" />
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Frequency</label>
//                   <select value={form.frequency} onChange={e => set('frequency', e.target.value)} className="input-field">
//                     {FREQUENCIES.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
//                   </select>
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-3">
//                 <div className="space-y-1">
//                   <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
//                   <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field">
//                     {CATEGORIES.map(c => <option key={c}>{c}</option>)}
//                   </select>
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Start Date</label>
//                   <input type="date" required value={form.start_date}
//                     onChange={e => set('start_date', e.target.value)} className="input-field" />
//                 </div>
//               </div>
//               <div className="space-y-1">
//                 <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes (optional)</label>
//                 <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
//                   rows={2} className="input-field resize-none" />
//               </div>
//               <div className="flex gap-3 pt-2">
//                 <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
//                 <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
//                   {saving && <Loader2 size={16} className="animate-spin" />}
//                   {saving ? 'Saving...' : editItem ? 'Update' : 'Add'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }


 // src/components/recurring/RecurringPage.jsx
import React, { useState } from 'react'
import { useRecurring } from '../../hooks/useRecurring'
import RecurringModal from './RecurringModal'
import { Plus, Trash2, Edit2, Loader2, RefreshCw, RotateCcw, Calendar, Zap } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

const FREQ_COLORS = {
  daily:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  weekly:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  monthly: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  yearly:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export default function RecurringPage() {
  const { recurring, loading, add, edit, remove, generateDue } = useRecurring()
  const [modalOpen, setModalOpen]   = useState(false)
  const [editItem, setEditItem]     = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [generating, setGenerating] = useState(false)

  const fmt = (n) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(n)

  const handleDelete = async (id) => {
    if (!confirm('Delete this recurring expense?')) return
    setDeletingId(id)
    try { await remove(id) } finally { setDeletingId(null) }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try { await generateDue() } finally { setGenerating(false) }
  }

  const totalMonthly = recurring.reduce((sum, r) => {
    const multipliers = { daily: 30, weekly: 4, monthly: 1, yearly: 1/12 }
    return sum + (parseFloat(r.amount) * (multipliers[r.frequency] || 1))
  }, 0)

  const handleSave = async (data) => {
    try {
      console.log('Saving recurring:', data)
      if (editItem) {
        await edit(editItem.id, data)
      } else {
        await add(data)
      }
      setModalOpen(false)
      setEditItem(null)
    } catch (err) {
      console.error('Save failed:', err?.response?.data || err.message)
      throw err
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recurring Expenses</h1>
          <p className="text-slate-500 text-sm mt-1">
            {recurring.length} active · {fmt(totalMonthly)}/month estimated
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {generating
              ? <Loader2 size={16} className="animate-spin" />
              : <Zap size={16} />
            }
            <span className="hidden sm:inline">Generate Due</span>
          </button>
          <button
            onClick={() => { setEditItem(null); setModalOpen(true) }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Recurring</span>
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <RefreshCw size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">How it works</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
              Add subscriptions, EMIs, rent etc. Click "Generate Due" to automatically
              create expense entries for all items due today or earlier.
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-brand-500" />
          </div>
        ) : recurring.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-3">
              <RefreshCw size={24} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">No recurring expenses</p>
            <p className="text-sm text-slate-400 mt-1">Add subscriptions, rent, EMIs and more</p>
            <button
              onClick={() => { setEditItem(null); setModalOpen(true) }}
              className="btn-primary mt-4 flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> Add First Recurring
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {recurring.map(item => {
              const isDue = new Date(item.next_due_date) <= new Date()
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{item.title}</p>
                      <span className={`badge text-xs ${FREQ_COLORS[item.frequency] || ''}`}>
                        {item.frequency}
                      </span>
                      {isDue && (
                        <span className="badge text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Due!
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar size={11} />
                        Next: {format(new Date(item.next_due_date), 'dd MMM yyyy')}
                      </span>
                      <span className="text-xs text-slate-400">{item.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="font-semibold font-mono text-slate-900 dark:text-white text-sm">
                      {fmt(item.amount)}
                    </p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditItem(item); setModalOpen(true) }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-700"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"
                      >
                        {deletingId === item.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <RecurringModal
          item={editItem}
          onClose={() => {
            setModalOpen(false)
            setEditItem(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}