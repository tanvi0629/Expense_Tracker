// frontend/src/components/expenses/ReceiptUploader.jsx
import React, { useState, useRef } from 'react'
import { Camera, X, Eye, Trash2, Loader2, Upload } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function ReceiptUploader({ expenseId, hasReceipt, onUpdate }) {
  const [preview, setPreview]   = useState(null)
  const [viewing, setViewing]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [receipt, setReceipt]   = useState(null)
  const fileRef                 = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Max 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(',')[1]
      setPreview(ev.target.result)
      setLoading(true)
      try {
        await api.post(`/expenses/${expenseId}/receipt`, {
          receipt_base64: base64,
          receipt_mime: file.type,
        })
        toast.success('Receipt uploaded!')
        if (onUpdate) onUpdate(true)
      } catch (err) {
        toast.error(err.response?.data?.message || 'Upload failed')
        setPreview(null)
      } finally { setLoading(false) }
    }
    reader.readAsDataURL(file)
  }

  const handleView = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/expenses/${expenseId}/receipt`)
      setReceipt(`data:${data.receipt_mime};base64,${data.receipt_base64}`)
      setViewing(true)
    } catch (_) { toast.error('Could not load receipt') }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this receipt?')) return
    setLoading(true)
    try {
      await api.delete(`/expenses/${expenseId}/receipt`)
      setPreview(null)
      setReceipt(null)
      setViewing(false)
      toast.success('Receipt deleted')
      if (onUpdate) onUpdate(false)
    } catch (_) { toast.error('Failed to delete') }
    finally { setLoading(false) }
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Upload button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-400 hover:text-brand-500 transition-colors"
          title="Upload receipt"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
        </button>

        {/* View receipt if exists */}
        {hasReceipt && (
          <button onClick={handleView} disabled={loading}
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 transition-colors"
            title="View receipt">
            <Eye size={14} />
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {/* Receipt viewer modal */}
      {viewing && receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setViewing(false)}>
          <div className="relative max-w-lg w-full animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Receipt</p>
                <div className="flex items-center gap-2">
                  <button onClick={handleDelete}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 size={13} /> Delete
                  </button>
                  <button onClick={() => setViewing(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <img src={receipt} alt="Receipt" className="w-full object-contain max-h-[70vh]" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
