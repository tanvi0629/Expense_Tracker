// src/components/auth/AuthLayout.jsx
import React from 'react'
import { TrendingUp } from 'lucide-react'

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-brand-300/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <TrendingUp size={20} className="text-white" />
            </div>
            <span className="font-display text-2xl font-bold text-slate-900 dark:text-white">Spendly</span>
          </div>
          {title && <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{title}</h1>}
          {subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm">{subtitle}</p>}
        </div>

        <div className="card p-6 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
          {children}
        </div>
      </div>
    </div>
  )
}
