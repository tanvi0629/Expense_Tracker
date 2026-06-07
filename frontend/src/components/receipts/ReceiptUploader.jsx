// src/components/receipts/ReceiptUploader.jsx
import React, { useState, useRef } from 'react'
import api from '../../services/api'
import { Camera, Upload, Trash2, Eye, Loader2, X, ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function ReceiptUploader({ expenseId, currentReceiptUrl, onUpdate }) {
  const [preview, setPreview]     = useState(currentReceiptUrl || null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file')
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB')

    setUploading(true)
    try {
      // Convert to base64
      const base64 = await fileToBase64(file)
      const { data } = await api.post(`/receipts/${expenseId}`, {
        imageBase64: base64,
        mimeType: file.type,
      })
      setPreview(data.receipt_url)
      if (onUpdate) onUpdate(data.receipt_url)
      toast.success('Receipt uploaded!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this receipt?')) return
    setDeleting(true)
    try {
      await api.delete(`/receipts/${expenseId}`)
      setPreview(null)
      if (onUpdate) onUpdate(null)
      toast.success('Receipt deleted')
    } catch (err) {
      toast.error('Failed to delete receipt')
    } finally {
      setDeleting(false)
    }
  }

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Receipt Photo <span className="text-slate-400">(optional)</span>
      </label>

      {preview ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700">
          <img
            src={preview}
            alt="Receipt"
            className="w-full h-40 object-cover"
          />
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={() => setViewerOpen(true)}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-xl bg-red-500/80 hover:bg-red-600 text-white transition-colors"
            >
              {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <Upload size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={clsx(
            'w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all',
            uploading
              ? 'border-brand-300 bg-brand-50 dark:bg-brand-900/10'
              : 'border-slate-300 dark:border-slate-600 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/10'
          )}
        >
          {uploading ? (
            <>
              <Loader2 size={24} className="animate-spin text-brand-500" />
              <p className="text-sm text-brand-600">Uploading...</p>
            </>
          ) : (
            <>
              <ImageIcon size={24} className="text-slate-400" />
              <p className="text-sm text-slate-500">Click to upload receipt</p>
              <p className="text-xs text-slate-400">JPG, PNG, HEIC up to 5MB</p>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Full size viewer */}
      {viewerOpen && preview && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setViewerOpen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
            onClick={() => setViewerOpen(false)}
          >
            <X size={20} />
          </button>
          <img
            src={preview}
            alt="Receipt"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
