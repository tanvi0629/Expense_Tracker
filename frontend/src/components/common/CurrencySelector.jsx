// frontend/src/components/common/CurrencySelector.jsx
import React, { useState } from 'react'
import { useCurrency } from '../../context/CurrencyContext'
import { ChevronDown, Check } from 'lucide-react'
import clsx from 'clsx'

export default function CurrencySelector() {
  const { currency, currencies, changeCurrency } = useCurrency()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="btn-ghost w-full flex items-center justify-between gap-2 text-sm"
      >
        <span className="flex items-center gap-2">
          <span className="font-mono font-bold text-brand-500">{currency.symbol}</span>
          {currency.code}
        </span>
        <ChevronDown size={14} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden z-50 animate-scale-in">
          <div className="max-h-48 overflow-y-auto py-1">
            {currencies.map(c => (
              <button
                key={c.code}
                onClick={() => { changeCurrency(c.code); setOpen(false) }}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="font-mono w-6 text-brand-500 font-bold">{c.symbol}</span>
                  <span className="text-slate-700 dark:text-slate-300">{c.code}</span>
                  <span className="text-slate-400 text-xs">{c.name}</span>
                </span>
                {currency.code === c.code && <Check size={14} className="text-brand-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
