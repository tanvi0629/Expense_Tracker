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
