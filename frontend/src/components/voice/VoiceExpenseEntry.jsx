// src/components/voice/VoiceExpenseEntry.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, Loader2, Check, X, Volume2, AlertCircle, Sparkles } from 'lucide-react'
import clsx from 'clsx'

const CATEGORIES = ['Food','Transport','Shopping','Entertainment','Bills','Health','Education','Other']

// ── AI parser via Groq ──────────────────────────────────────────────────────
async function parseVoiceWithAI(transcript, apiKey) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'system',
        content: `Extract expense details from voice input. Return ONLY JSON, no other text:
{
  "amount": number or null,
  "title": "merchant or description string",
  "category": "Food|Transport|Shopping|Entertainment|Bills|Health|Education|Other",
  "date": "today or YYYY-MM-DD",
  "notes": "any extra context or empty string",
  "confidence": "high|medium|low"
}

Category rules:
- Food: restaurant, cafe, food, eat, lunch, dinner, breakfast, snack, coffee, tea, grocery, vegetables, swiggy, zomato
- Transport: uber, ola, auto, bus, train, metro, petrol, fuel, cab, taxi, flight
- Shopping: clothes, amazon, flipkart, shopping, mall, store, shoes, electronics
- Entertainment: movie, cinema, netflix, spotify, game, concert, bowling
- Bills: electricity, wifi, internet, mobile, recharge, emi, rent, subscription
- Health: medicine, doctor, hospital, pharmacy, gym, medical
- Education: course, book, school, college, fee, tuition`
      }, {
        role: 'user',
        content: `Extract expense from: "${transcript}"`
      }],
      max_tokens: 200,
      temperature: 0.1,
    })
  })
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || '{}'
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Invalid response')
  return JSON.parse(match[0])
}

// ── Fallback rule-based parser ──────────────────────────────────────────────
function parseVoiceLocally(transcript) {
  const text = transcript.toLowerCase()

  // Amount patterns
  const amountPatterns = [
    /(\d+(?:\.\d{1,2})?)\s*(?:rupees?|rs\.?|₹|inr)/i,
    /(?:rupees?|rs\.?|₹|inr)\s*(\d+(?:\.\d{1,2})?)/i,
    /spent\s+(\d+(?:\.\d{1,2})?)/i,
    /paid\s+(\d+(?:\.\d{1,2})?)/i,
    /(\d+(?:\.\d{1,2})?)\s+(?:for|on|at)/i,
    /^(\d+(?:\.\d{1,2})?)/,
  ]
  let amount = null
  for (const p of amountPatterns) {
    const m = transcript.match(p)
    if (m) { amount = parseFloat(m[1]); break }
  }

  // Category detection
  const categoryMap = {
    Food:          ['food','eat','lunch','dinner','breakfast','snack','coffee','tea','restaurant','cafe','zomato','swiggy','pizza','burger','biryani','grocery','vegetables','milk'],
    Transport:     ['uber','ola','auto','bus','train','metro','petrol','fuel','cab','taxi','flight','rickshaw'],
    Shopping:      ['shopping','clothes','amazon','flipkart','mall','store','shoes','bag','electronics','bought'],
    Entertainment: ['movie','cinema','netflix','spotify','game','concert','bowling','theatre'],
    Bills:         ['electricity','wifi','internet','mobile','recharge','emi','rent','subscription','bill'],
    Health:        ['medicine','doctor','hospital','pharmacy','gym','medical','clinic'],
    Education:     ['course','book','school','college','fee','tuition','class'],
  }
  let category = 'Other'
  for (const [cat, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(k => text.includes(k))) { category = cat; break }
  }

  // Title extraction — remove amount words and extract merchant/purpose
  const titlePatterns = [
    /(?:at|from|for|on)\s+([a-zA-Z\s]+?)(?:\s+(?:for|on|at|in)|$)/i,
    /(?:spent|paid|bought?)\s+.*?(?:at|on|for)\s+([a-zA-Z\s]+)/i,
    /([a-zA-Z\s]+?)\s+(?:purchase|expense|bill|payment)/i,
  ]
  let title = ''
  for (const p of titlePatterns) {
    const m = transcript.match(p)
    if (m && m[1].trim().length > 2) { title = m[1].trim(); break }
  }
  if (!title) {
    // Use category as fallback title
    const words = transcript.split(' ').filter(w => !/\d/.test(w) && w.length > 2 && !['spent','paid','rupees','for','the','and','on','at','from','with'].includes(w.toLowerCase()))
    title = words.slice(0, 3).join(' ') || `${category} expense`
  }

  return {
    amount,
    title: title.charAt(0).toUpperCase() + title.slice(1),
    category,
    date: 'today',
    notes: transcript,
    confidence: amount ? 'medium' : 'low',
  }
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function VoiceExpenseEntry({ onExpenseExtracted, onClose }) {
  const [isListening, setIsListening]   = useState(false)
  const [transcript, setTranscript]     = useState('')
  const [processing, setProcessing]     = useState(false)
  const [extracted, setExtracted]       = useState(null)
  const [error, setError]               = useState(null)
  const [step, setStep]                 = useState('idle') // idle | listening | processing | review
  const [waveHeights, setWaveHeights]   = useState(Array(12).fill(4))
  const [browserSupported, setBrowserSupported] = useState(true)

  const recognitionRef = useRef(null)
  const waveInterval   = useRef(null)

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setBrowserSupported(false)
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop()
      if (waveInterval.current)   clearInterval(waveInterval.current)
    }
  }, [])

  const animateWave = () => {
    waveInterval.current = setInterval(() => {
      setWaveHeights(prev => prev.map(() => Math.random() * 32 + 4))
    }, 120)
  }

  const stopWave = () => {
    if (waveInterval.current) clearInterval(waveInterval.current)
    setWaveHeights(Array(12).fill(4))
  }

  const startListening = () => {
    setError(null)
    setTranscript('')
    setExtracted(null)
    setStep('listening')

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart   = () => { setIsListening(true); animateWave() }
    recognition.onend     = () => { setIsListening(false); stopWave() }

    recognition.onresult  = (e) => {
      const result = Array.from(e.results)
        .map(r => r[0].transcript)
        .join(' ')
      setTranscript(result)
      if (e.results[0].isFinal) processTranscript(result)
    }

    recognition.onerror = (e) => {
      stopWave()
      setIsListening(false)
      setStep('idle')
      if (e.error === 'not-allowed') setError('Microphone access denied. Allow microphone in browser settings.')
      else if (e.error === 'no-speech') setError('No speech detected. Try speaking louder.')
      else setError(`Error: ${e.error}. Please try again.`)
    }

    recognition.start()
  }

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop()
    stopWave()
    setIsListening(false)
  }

  const processTranscript = useCallback(async (text) => {
    if (!text.trim()) return
    setStep('processing')
    setProcessing(true)

    try {
      let result
      const apiKey = import.meta.env.VITE_GROQ_API_KEY
      if (apiKey) {
        try {
          result = await parseVoiceWithAI(text, apiKey)
        } catch (_) {
          result = parseVoiceLocally(text)
        }
      } else {
        result = parseVoiceLocally(text)
      }

      // Fix date
      const today = new Date().toISOString().split('T')[0]
      if (!result.date || result.date === 'today') result.date = today

      // Ensure all fields
      result.title    = result.title    || 'Voice Expense'
      result.category = CATEGORIES.includes(result.category) ? result.category : 'Other'
      result.notes    = result.notes    || text

      setExtracted(result)
      setStep('review')
    } catch (err) {
      setError('Could not parse expense. Please try again.')
      setStep('idle')
    } finally {
      setProcessing(false)
    }
  }, [])

  const handleConfirm = () => {
    if (onExpenseExtracted && extracted) {
      onExpenseExtracted({
        title:    extracted.title,
        amount:   extracted.amount || '',
        category: extracted.category,
        date:     extracted.date,
        notes:    extracted.notes,
      })
    }
    onClose?.()
  }

  const reset = () => {
    setStep('idle')
    setTranscript('')
    setExtracted(null)
    setError(null)
  }

  const EXAMPLES = [
    '"Spent 250 on lunch at Cafe Coffee Day"',
    '"Paid 500 rupees for Uber cab"',
    '"Netflix subscription 649 rupees"',
    '"Bought medicines worth 180"',
    '"Groceries 1200 from DMart"',
  ]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md card shadow-2xl animate-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Mic size={18} className="text-red-500" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">Voice Expense Entry</p>
              <p className="text-xs text-slate-500">Speak to add an expense</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          {!browserSupported && (
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <AlertCircle size={16} className="text-amber-500 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Voice recognition is not supported in this browser. Use Chrome or Edge for best results.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* IDLE state */}
          {step === 'idle' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-4">
                <button
                  onClick={startListening}
                  disabled={!browserSupported}
                  className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Mic size={36} className="text-white" />
                </button>
                <p className="text-slate-500 text-sm mt-4">Tap to start speaking</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">💬 Try saying:</p>
                <div className="space-y-1.5">
                  {EXAMPLES.map((ex, i) => (
                    <p key={i} className="text-xs text-slate-600 dark:text-slate-400 italic">{ex}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LISTENING state */}
          {step === 'listening' && (
            <div className="flex flex-col items-center py-4 space-y-5">
              {/* Waveform */}
              <div className="flex items-center gap-1 h-12">
                {waveHeights.map((h, i) => (
                  <div
                    key={i}
                    className="w-2 rounded-full bg-red-500 transition-all duration-100"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>

              <div className="text-center">
                <p className="text-red-500 font-semibold animate-pulse">🎤 Listening...</p>
                {transcript && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 italic">"{transcript}"</p>
                )}
              </div>

              <button onClick={stopListening}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                <MicOff size={16} /> Stop Recording
              </button>
            </div>
          )}

          {/* PROCESSING state */}
          {step === 'processing' && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Sparkles size={28} className="text-purple-500 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-900 dark:text-white">AI is parsing your expense...</p>
                <p className="text-xs text-slate-500 mt-1 italic">"{transcript}"</p>
              </div>
              <Loader2 size={20} className="animate-spin text-purple-500" />
            </div>
          )}

          {/* REVIEW state */}
          {step === 'review' && extracted && (
            <div className="space-y-4">
              {/* Confidence badge */}
              <div className={clsx(
                'flex items-center gap-2 rounded-xl p-3 border text-sm',
                extracted.confidence === 'high'
                  ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-400'
                  : extracted.confidence === 'medium'
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              )}>
                <Sparkles size={14} />
                <span>
                  {extracted.confidence === 'high' ? '✅ High confidence extraction' :
                   extracted.confidence === 'medium' ? '⚡ Medium confidence — please review' :
                   '⚠️ Low confidence — please fill in details'}
                </span>
              </div>

              {/* Heard */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">You said:</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{transcript}"</p>
              </div>

              {/* Extracted fields — editable */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</label>
                  <input type="text" value={extracted.title}
                    onChange={e => setExtracted(d => ({...d, title: e.target.value}))}
                    className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount (₹)</label>
                    <input type="number" value={extracted.amount || ''}
                      onChange={e => setExtracted(d => ({...d, amount: e.target.value}))}
                      placeholder="0.00" className="input-field font-mono"
                      style={{ borderColor: !extracted.amount ? '#ef4444' : '' }} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</label>
                    <input type="date" value={extracted.date}
                      onChange={e => setExtracted(d => ({...d, date: e.target.value}))}
                      className="input-field" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</label>
                  <select value={extracted.category}
                    onChange={e => setExtracted(d => ({...d, category: e.target.value}))}
                    className="input-field">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {!extracted.amount && (
                <p className="text-xs text-red-500">⚠️ Amount not detected — please enter it manually</p>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={reset} className="btn-secondary flex items-center gap-2">
                  <Mic size={14} /> Try Again
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!extracted.amount || !extracted.title}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Check size={16} /> Use This Expense
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
