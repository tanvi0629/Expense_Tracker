// // src/components/settings/CurrencySettings.jsx
// import React, { useState } from 'react'
// import { useCurrency, CURRENCIES } from '../../hooks/useCurrency'
// import { Check, RefreshCw, Loader2 } from 'lucide-react'
// import toast from 'react-hot-toast'
// import clsx from 'clsx'

// export default function CurrencySettings() {
//   const { currency, setCurrency, rates, loading } = useCurrency()
//   const [saving, setSaving] = useState(false)

//   const handleSelect = async (code) => {
//     setSaving(true)
//     try {
//       await setCurrency(code)
//       toast.success(`Currency changed to ${CURRENCIES[code].name}`)
//     } catch (_) {
//       toast.error('Failed to update currency')
//     } finally { setSaving(false) }
//   }

//   return (
//     <div className="space-y-5 animate-fade-in">
//       <div>
//         <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Currency Settings</h1>
//         <p className="text-slate-500 text-sm mt-1">Choose your preferred display currency</p>
//       </div>

//       {/* Current currency */}
//       <div className="card p-5">
//         <p className="text-sm font-medium text-slate-500 mb-1">Current Currency</p>
//         <div className="flex items-center gap-3">
//           <span className="text-3xl font-bold text-brand-500">{CURRENCIES[currency]?.symbol}</span>
//           <div>
//             <p className="font-bold text-slate-900 dark:text-white">{currency}</p>
//             <p className="text-sm text-slate-500">{CURRENCIES[currency]?.name}</p>
//           </div>
//         </div>
//       </div>

//       {/* Exchange rates */}
//       {Object.keys(rates).length > 0 && (
//         <div className="card p-5">
//           <div className="flex items-center justify-between mb-4">
//             <p className="font-semibold text-slate-900 dark:text-white text-sm">Live Exchange Rates</p>
//             <span className="text-xs text-slate-400 flex items-center gap-1">
//               <RefreshCw size={11} /> Live
//             </span>
//           </div>
//           <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
//             {Object.entries(CURRENCIES).filter(([code]) => code !== currency).map(([code, info]) => (
//               <div key={code} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
//                 <p className="text-xs text-slate-500">{info.symbol} {code}</p>
//                 <p className="font-mono font-semibold text-slate-900 dark:text-white text-sm">
//                   {rates[code] ? rates[code].toFixed(code === 'JPY' ? 2 : 4) : '—'}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Currency selector */}
//       <div className="card p-5">
//         <p className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Select Currency</p>
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
//           {Object.entries(CURRENCIES).map(([code, info]) => (
//             <button
//               key={code}
//               onClick={() => handleSelect(code)}
//               disabled={saving}
//               className={clsx(
//                 'flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left',
//                 currency === code
//                   ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
//                   : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700'
//               )}
//             >
//               <span className="text-xl w-8 text-center">{info.symbol}</span>
//               <div className="flex-1">
//                 <p className="font-semibold text-sm text-slate-900 dark:text-white">{code}</p>
//                 <p className="text-xs text-slate-500">{info.name}</p>
//               </div>
//               {currency === code && <Check size={16} className="text-brand-500 flex-shrink-0" />}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Converter */}
//       <CurrencyConverter rates={rates} currentCurrency={currency} />
//     </div>
//   )
// }

// function CurrencyConverter({ rates, currentCurrency }) {
//   const [amount, setAmount]   = useState('')
//   const [fromCur, setFromCur] = useState(currentCurrency)
//   const [toCur, setToCur]     = useState(currentCurrency === 'INR' ? 'USD' : 'INR')
//   const [result, setResult]   = useState(null)
//   const [loading, setLoading] = useState(false)
//   const { convert } = useCurrency()

//   const handleConvert = async () => {
//     if (!amount || parseFloat(amount) <= 0) return
//     setLoading(true)
//     try {
//       const converted = await convert(parseFloat(amount), fromCur, toCur)
//       setResult(converted)
//     } finally { setLoading(false) }
//   }

//   return (
//     <div className="card p-5">
//       <p className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Currency Converter</p>
//       <div className="space-y-3">
//         <div className="grid grid-cols-3 gap-2 items-end">
//           <div className="space-y-1">
//             <label className="text-xs text-slate-500">Amount</label>
//             <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
//               placeholder="100" className="input-field" />
//           </div>
//           <div className="space-y-1">
//             <label className="text-xs text-slate-500">From</label>
//             <select value={fromCur} onChange={e => setFromCur(e.target.value)} className="input-field">
//               {Object.keys(CURRENCIES).map(c => <option key={c}>{c}</option>)}
//             </select>
//           </div>
//           <div className="space-y-1">
//             <label className="text-xs text-slate-500">To</label>
//             <select value={toCur} onChange={e => setToCur(e.target.value)} className="input-field">
//               {Object.keys(CURRENCIES).map(c => <option key={c}>{c}</option>)}
//             </select>
//           </div>
//         </div>

//         <button onClick={handleConvert} disabled={loading || !amount}
//           className="btn-primary w-full flex items-center justify-center gap-2">
//           {loading && <Loader2 size={16} className="animate-spin" />}
//           Convert
//         </button>

//         {result !== null && (
//           <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-3 text-center animate-fade-in">
//             <p className="text-sm text-slate-500">{amount} {fromCur} =</p>
//             <p className="text-2xl font-bold font-display text-brand-600 dark:text-brand-400">
//               {CURRENCIES[toCur]?.symbol}{result.toLocaleString()}
//             </p>
//             <p className="text-xs text-slate-400">{toCur}</p>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }
// src/components/settings/CurrencySettings.jsx
import React, { useState } from 'react'
import { useCurrency, CURRENCIES } from '../../hooks/useCurrency'
import { Check, RefreshCw, Loader2 } from 'lucide-react'
import clsx from 'clsx'

export default function CurrencySettings() {
  const { currency, setCurrency, rates, loading } = useCurrency()

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Currency Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Choose your preferred display currency</p>
      </div>

      {/* Current currency */}
      <div className="card p-5">
        <p className="text-sm font-medium text-slate-500 mb-2">Current Currency</p>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-brand-500">{CURRENCIES[currency]?.symbol}</span>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">{currency}</p>
            <p className="text-sm text-slate-500">{CURRENCIES[currency]?.name}</p>
          </div>
        </div>
      </div>

      {/* Live rates */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-slate-900 dark:text-white text-sm">Exchange Rates (Base: INR)</p>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            {loading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            {loading ? 'Loading...' : 'Live'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(CURRENCIES).map(([code, info]) => (
            <div key={code} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
              <p className="text-xs text-slate-500">{info.symbol} {code}</p>
              <p className="font-mono font-semibold text-slate-900 dark:text-white text-sm">
                {rates[code] ? rates[code].toFixed(code === 'JPY' ? 2 : 4) : '—'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Selector */}
      <div className="card p-5">
        <p className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Select Your Currency</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(CURRENCIES).map(([code, info]) => (
            <button
              key={code}
              onClick={() => setCurrency(code)}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left',
                currency === code
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700'
              )}
            >
              <span className="text-xl w-8 text-center">{info.symbol}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm text-slate-900 dark:text-white">{code}</p>
                <p className="text-xs text-slate-500">{info.name}</p>
              </div>
              {currency === code && <Check size={16} className="text-brand-500 flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Converter */}
      <CurrencyConverter rates={rates} />
    </div>
  )
}

function CurrencyConverter({ rates }) {
  const { convert } = useCurrency()
  const [amount, setAmount]   = useState('')
  const [fromCur, setFromCur] = useState('INR')
  const [toCur, setToCur]     = useState('USD')
  const [result, setResult]   = useState(null)

  const handleConvert = () => {
    if (!amount || parseFloat(amount) <= 0) return
    const converted = convert(parseFloat(amount), fromCur, toCur)
    setResult(converted)
  }

  return (
    <div className="card p-5">
      <p className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Currency Converter</p>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Amount</label>
            <input
              type="number" value={amount}
              onChange={e => { setAmount(e.target.value); setResult(null) }}
              placeholder="100" className="input-field"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">From</label>
            <select value={fromCur} onChange={e => { setFromCur(e.target.value); setResult(null) }} className="input-field">
              {Object.keys(CURRENCIES).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">To</label>
            <select value={toCur} onChange={e => { setToCur(e.target.value); setResult(null) }} className="input-field">
              {Object.keys(CURRENCIES).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleConvert} disabled={!amount} className="btn-primary w-full">
          Convert
        </button>

        {result !== null && (
          <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4 text-center animate-fade-in">
            <p className="text-sm text-slate-500">{amount} {fromCur} =</p>
            <p className="text-2xl font-bold font-display text-brand-600 dark:text-brand-400">
              {CURRENCIES[toCur]?.symbol}{result.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1">{toCur} — {CURRENCIES[toCur]?.name}</p>
          </div>
        )}
      </div>
    </div>
  )
}