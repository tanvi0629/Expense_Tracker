// src/components/common/LoadingScreen.jsx
import React from 'react'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-900 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-700" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin" />
        </div>
        <div className="text-center">
          <p className="font-display text-xl font-bold text-slate-900 dark:text-white">Spendly</p>
          <p className="text-sm text-slate-500 mt-1">Loading your finances…</p>
        </div>
      </div>
    </div>
  )
}
