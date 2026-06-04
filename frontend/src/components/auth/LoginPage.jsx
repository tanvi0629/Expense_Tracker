// src/components/auth/LoginPage.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from './AuthLayout'
import { Eye, EyeOff, Mail, Lock, Chrome, Phone, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { loginWithEmail, loginWithGoogle, authError, clearError } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    clearError()
    setLoading(true)
    try {
      await loginWithEmail(email, password)
      navigate('/dashboard')
    } catch (_) {
      // error set by context
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    clearError()
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (_) {
      // error set by context
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your finances">
      <form onSubmit={handleEmailLogin} className="space-y-4">
        {authError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm animate-fade-in">
            {authError}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <Link to="/forgot-password" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPw ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        <span className="text-xs text-slate-400">or continue with</span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Social buttons */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="btn-secondary w-full flex items-center justify-center gap-2.5"
        >
          {googleLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.6-5 7.3v6h8c4.7-4.3 7.3-10.7 7.3-17.4z"/>
              <path fill="#34A853" d="M24 48c6.5 0 12-2.2 16-5.9l-8-6c-2.2 1.5-5 2.3-8 2.3-6.1 0-11.3-4.1-13.2-9.7H2.7v6.2C6.7 42.9 14.8 48 24 48z"/>
              <path fill="#FBBC05" d="M10.8 28.7A14.9 14.9 0 0 1 10 24c0-1.6.3-3.2.8-4.7v-6.2H2.7A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.7 10.9l8.1-6.2z"/>
              <path fill="#EA4335" d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.6-6.6C35.9 2.4 30.4 0 24 0 14.8 0 6.7 5.1 2.7 13.1l8.1 6.2c1.9-5.6 7.1-9.8 13.2-9.8z"/>
            </svg>
          )}
          Continue with Google
        </button>

        <Link
          to="/phone-auth"
          className="btn-secondary w-full flex items-center justify-center gap-2.5"
        >
          <Phone size={16} />
          Continue with Phone Number
        </Link>
      </div>

      <p className="text-center text-sm text-slate-500 mt-6">
        Don't have an account?{' '}
        <Link to="/signup" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  )
}
