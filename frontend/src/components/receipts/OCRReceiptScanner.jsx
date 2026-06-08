// src/components/receipts/OCRReceiptScanner.jsx
// Tesseract.js offline OCR — no API key needed
import React, { useState, useRef, useCallback } from 'react'
import { Camera, Upload, Loader2, X, Sparkles, Check, RefreshCw, ImageIcon, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

const CATEGORIES = ['Food','Transport','Shopping','Entertainment','Bills','Health','Education','Other']

// ── OCR Text Parser ────────────────────────────────────────────────────────
function parseReceiptText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const full  = text.toLowerCase()

  // ── Amount detection ──────────────────────────────────────────────────
  // Try to find total/grand total first, then any amount
  const totalPatterns = [
    /(?:grand\s*total|total\s*amount|net\s*total|amount\s*due|total\s*bill|total)[:\s]*(?:rs\.?|₹|inr)?\s*(\d+(?:[,\d]*)?(?:\.\d{1,2})?)/i,
    /(?:rs\.?|₹|inr)\s*(\d+(?:[,\d]*)?(?:\.\d{1,2})?)\s*(?:total|only)/i,
    /(\d+(?:[,\d]*)?(?:\.\d{2}))\s*(?:total|only|rs)/i,
  ]
  let amount = null
  for (const p of totalPatterns) {
    const m = text.match(p)
    if (m) { amount = parseFloat(m[1].replace(/,/g, '')); break }
  }
  // fallback — find largest number on receipt
  if (!amount) {
    const allAmounts = [...text.matchAll(/(?:rs\.?|₹)?\s*(\d{2,6}(?:\.\d{1,2})?)/gi)]
      .map(m => parseFloat(m[1].replace(/,/g, '')))
      .filter(n => n > 0 && n < 1000000)
    if (allAmounts.length) amount = Math.max(...allAmounts)
  }

  // ── Date detection ────────────────────────────────────────────────────
  const datePatterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,
    /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{2,4})/i,
  ]
  let date = new Date().toISOString().split('T')[0]
  for (const p of datePatterns) {
    const m = text.match(p)
    if (m) {
      try {
        let d
        if (p.source.startsWith('(\\d{4})')) {
          d = new Date(`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`)
        } else if (/jan|feb/i.test(m[2])) {
          d = new Date(`${m[1]} ${m[2]} ${m[3]}`)
        } else {
          const y = m[3].length === 2 ? `20${m[3]}` : m[3]
          d = new Date(`${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`)
        }
        if (!isNaN(d.getTime()) && d.getFullYear() >= 2020) {
          date = d.toISOString().split('T')[0]
          break
        }
      } catch (_) {}
    }
  }

  // ── Merchant / Title detection ────────────────────────────────────────
  // Usually first non-empty line or line before "invoice/receipt"
  let title = ''
  const skipWords = ['tax','gst','total','amount','date','time','cash','card','receipt','invoice','bill','thank','visit','welcome','phone','address']
  for (const line of lines.slice(0, 5)) {
    const lower = line.toLowerCase()
    const hasSkip = skipWords.some(w => lower.includes(w))
    const hasNum  = /^\d/.test(line)
    if (!hasSkip && !hasNum && line.length > 2 && line.length < 50) {
      title = line.replace(/[^a-zA-Z0-9\s\-&]/g, '').trim()
      if (title.length > 2) break
    }
  }
  if (!title) title = 'Receipt Expense'

  // ── Category detection ────────────────────────────────────────────────
  const categoryMap = {
    Food:          ['restaurant','cafe','coffee','food','pizza','burger','hotel','bakery','swiggy','zomato','dunkin','mcdonald','kfc','subway','biryani','dhaba','canteen','mess','tiffin','juice','tea','milk','grocery','supermarket','mart','bazaar','fresh','vegetables','fruits','dmart','big bazaar','reliance fresh','more','nature basket'],
    Transport:     ['fuel','petrol','diesel','gas','cng','uber','ola','rapido','metro','bus','train','flight','airline','cab','taxi','auto','rickshaw','parking','toll','shell','hp petrol','iocl','bpcl'],
    Shopping:      ['shop','store','mall','fashion','clothing','clothes','wear','amazon','flipkart','myntra','ajio','zara','h&m','lifestyle','westside','brand','shoe','bag','accessory'],
    Bills:         ['electricity','water','internet','wifi','broadband','mobile','recharge','dth','postpaid','prepaid','emi','loan','rent','jio','airtel','bsnl','vi','vodafone','tata'],
    Health:        ['medical','pharmacy','hospital','clinic','doctor','medicine','health','apollo','fortis','medplus','wellness','lab','diagnostic','chemist','drug'],
    Entertainment: ['cinema','movie','theatre','multiplex','pvr','inox','bookmyshow','netflix','spotify','game','fun','bowling','sport','gym','fitness'],
    Education:     ['school','college','university','course','book','stationery','pen','notebook','exam','fee','tuition','coaching'],
  }
  let category = 'Other'
  let maxMatches = 0
  for (const [cat, keywords] of Object.entries(categoryMap)) {
    const matches = keywords.filter(k => full.includes(k)).length
    if (matches > maxMatches) { maxMatches = matches; category = cat }
  }

  return {
    title:    title.slice(0, 60),
    amount:   amount ? parseFloat(amount.toFixed(2)) : '',
    date,
    category,
    notes:    `Scanned from receipt`,
  }
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function OCRReceiptScanner({ onDataExtracted, onClose }) {
  const [step, setStep]         = useState('upload') // upload | scanning | review | done
  const [image, setImage]       = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [progress, setProgress] = useState(0)
  const [extracted, setExtracted] = useState(null)
  const [error, setError]       = useState(null)
  const [editData, setEditData] = useState(null)
  const fileInputRef = useRef(null)

  const processImage = useCallback(async (file) => {
    setStep('scanning')
    setError(null)
    setProgress(0)

    try {
      // Dynamic import of Tesseract to avoid bundle size issues
      const Tesseract = await import('tesseract.js')
      const { createWorker } = Tesseract

      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          }
        }
      })

      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()

      if (!text || text.trim().length < 5) {
        throw new Error('Could not read text from image. Try a clearer photo.')
      }

      const parsed = parseReceiptText(text)
      setExtracted({ ...parsed, rawText: text })
      setEditData({ ...parsed })
      setStep('review')
    } catch (err) {
      setError(err.message || 'OCR failed. Please try a clearer image.')
      setStep('upload')
    }
  }, [])

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10MB'); return }

    setImage(file)
    setImageUrl(URL.createObjectURL(file))
    await processImage(file)
  }

  const handleConfirm = () => {
    if (onDataExtracted) onDataExtracted(editData)
    setStep('done')
    setTimeout(() => onClose?.(), 800)
  }

  const handleRetry = () => {
    setStep('upload')
    setImage(null)
    setImageUrl(null)
    setExtracted(null)
    setEditData(null)
    setError(null)
    setProgress(0)
  }

  const set = (k, v) => setEditData(d => ({ ...d, [k]: v }))

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg card shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Sparkles size={16} className="text-purple-500" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">Receipt Scanner</p>
              <p className="text-xs text-slate-500">OCR auto-fills expense details</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        <div className="p-6">
          {/* STEP: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera size={28} className="text-purple-500" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Take or Upload Receipt Photo</p>
                  <p className="text-sm text-slate-400 mt-1">JPG, PNG up to 10MB</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-3 py-1.5 rounded-full">
                  <Sparkles size={11} />
                  AI extracts amount, date, merchant & category
                </div>
              </button>

              {/* Tips */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">📸 Tips for best results</p>
                {['Ensure good lighting — avoid shadows','Keep receipt flat and fully visible','Capture the total amount clearly','Higher resolution = better accuracy'].map((tip,i) => (
                  <p key={i} className="text-xs text-slate-500 flex items-start gap-1.5">
                    <span className="text-brand-500 mt-0.5">•</span>{tip}
                  </p>
                ))}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
                onChange={handleFileSelect} className="hidden" />
            </div>
          )}

          {/* STEP: Scanning */}
          {step === 'scanning' && (
            <div className="space-y-6">
              {imageUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 max-h-48">
                  <img src={imageUrl} alt="Receipt" className="w-full h-48 object-cover" />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-purple-500" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {progress < 20 ? 'Loading OCR engine...' :
                       progress < 60 ? 'Reading receipt text...' :
                       progress < 90 ? 'Extracting data...' : 'Almost done...'}
                    </p>
                  </div>
                  <span className="text-sm font-mono font-bold text-purple-600">{progress}%</span>
                </div>

                <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-brand-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  {['OCR Engine', 'Text Extraction', 'Data Parsing'].map((s, i) => (
                    <div key={i} className={clsx('py-1.5 px-2 rounded-lg', progress > i*33 ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400')}>
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center">
                🔒 Processing happens entirely on your device — no data sent to any server
              </p>
            </div>
          )}

          {/* STEP: Review extracted data */}
          {step === 'review' && editData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl">
                <Check size={16} className="text-brand-500 flex-shrink-0" />
                <p className="text-sm text-brand-700 dark:text-brand-400 font-medium">
                  Receipt scanned! Review and edit the extracted details below.
                </p>
              </div>

              {imageUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
                  <img src={imageUrl} alt="Receipt" className="w-full h-32 object-cover" />
                </div>
              )}

              {/* Editable fields */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Merchant / Title
                  </label>
                  <input type="text" value={editData.title} onChange={e => set('title', e.target.value)}
                    className="input-field" placeholder="Merchant name" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount (₹)</label>
                    <input type="number" step="0.01" value={editData.amount} onChange={e => set('amount', e.target.value)}
                      className="input-field font-mono" placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</label>
                    <input type="date" value={editData.date} onChange={e => set('date', e.target.value)}
                      className="input-field" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</label>
                  <select value={editData.category} onChange={e => set('category', e.target.value)} className="input-field">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</label>
                  <input type="text" value={editData.notes} onChange={e => set('notes', e.target.value)}
                    className="input-field" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleRetry} className="btn-secondary flex items-center gap-2 text-sm">
                  <RefreshCw size={14} /> Rescan
                </button>
                <button onClick={handleConfirm} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Check size={16} /> Use These Details
                </button>
              </div>
            </div>
          )}

          {/* STEP: Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-8 gap-3 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <Check size={28} className="text-brand-500" />
              </div>
              <p className="font-bold text-slate-900 dark:text-white">Details Applied!</p>
              <p className="text-sm text-slate-500">Expense form has been filled automatically</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
