// src/components/common/LoadingScreen.jsx
import React from 'react'
import { SpendlyIcon } from './SpendlyLogo'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-900 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-5">
        {/* Pulsing logo */}
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-brand-500 opacity-20 animate-ping" />
          <SpendlyIcon size={64} />
        </div>
        <div className="text-center">
          <p
            style={{
              fontFamily: "'Syne','DM Sans',sans-serif",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg,#534AB7 0%,#22C55E 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Spendly
          </p>
          <p className="text-sm text-slate-400 mt-1">Loading your finances…</p>
        </div>
        {/* Progress bar */}
        <div className="w-40 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full animate-pulse"
            style={{ background: 'linear-gradient(90deg,#534AB7,#22C55E)', width: '60%' }}
          />
        </div>
      </div>
    </div>
  )
}