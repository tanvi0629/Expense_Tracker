// src/components/auth/ForgotPasswordPage.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from './AuthLayout'
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const { resetPassword, authError, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (_) {
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Reset password" subtitle="We'll send you a reset link">
      {sent ? (
        <div className="text-center space-y-4 py-4 animate-fade-in">
          <div className="flex justify-center">
            <CheckCircle2 size={48} className="text-brand-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Check your inbox</p>
            <p className="text-sm text-slate-500 mt-1">We sent a reset link to <strong>{email}</strong></p>
          </div>
          <Link to="/login" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {authError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
              {authError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className="input-field pl-10"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>

          <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mt-2">
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </form>
      )}
    </AuthLayout>
  )
}
