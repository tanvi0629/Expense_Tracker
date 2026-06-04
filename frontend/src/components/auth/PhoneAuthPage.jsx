// src/components/auth/PhoneAuthPage.jsx
import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePhoneAuth } from '../../hooks/usePhoneAuth'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from './AuthLayout'
import { Phone, ArrowLeft, Loader2, RefreshCw } from 'lucide-react'

export default function PhoneAuthPage() {
  const navigate = useNavigate()
  const { syncWithBackend } = useAuth()
  const [phone, setPhone] = useState('+91')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef([])

  const { step, loading, error, sendOTP, verifyOTP, reset } = usePhoneAuth(async (firebaseUser) => {
    try {
      await syncWithBackend(firebaseUser)
      navigate('/dashboard')
    } catch (_) {
      navigate('/dashboard')
    }
  })

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus()
    }
  }

  const handleVerify = () => {
    const code = otp.join('')
    if (code.length === 6) verifyOTP(code)
  }

  return (
    <AuthLayout
      title={step === 'phone' ? 'Phone sign-in' : 'Enter OTP'}
      subtitle={step === 'phone' ? `We'll send you a verification code` : `Code sent to ${phone}`}    >
      {/* Invisible recaptcha container */}
      <div id="recaptcha-container" />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {step === 'phone' ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+91 9876543210" className="input-field pl-10"
              />
            </div>
            <p className="text-xs text-slate-400">Include country code, e.g. +91 for India</p>
          </div>

          <button
            onClick={() => sendOTP(phone)}
            disabled={loading || phone.length < 8}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Sending OTP…' : 'Send OTP'}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => otpRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                className="w-11 h-12 text-center text-lg font-mono font-bold input-field px-0 rounded-xl"
              />
            ))}
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || otp.join('').length < 6}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Verifying…' : 'Verify OTP'}
          </button>

          <button onClick={reset} className="btn-ghost w-full flex items-center justify-center gap-2 text-sm">
            <RefreshCw size={14} /> Resend code
          </button>
        </div>
      )}

      <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mt-4">
        <ArrowLeft size={14} /> Back to Login
      </Link>
    </AuthLayout>
  )
}
