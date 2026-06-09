// src/components/auth/AuthLayout.jsx
import React from 'react'
import { SpendlyLogo } from '../common/SpendlyLogo'

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(83,74,183,0.08) 0%, transparent 70%)' }} />
      <div className="fixed bottom-0 left-0 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <SpendlyLogo size="lg" />
          {title && (
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{title}</h1>
          )}
          {subtitle && (
            <p className="text-slate-500 dark:text-slate-400 text-sm">{subtitle}</p>
          )}
        </div>

        <div className="card p-6 md:p-8 shadow-xl"
          style={{ boxShadow: '0 20px 60px rgba(83,74,183,0.08), 0 4px 16px rgba(0,0,0,0.06)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
