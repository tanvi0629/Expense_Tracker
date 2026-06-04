// src/hooks/usePhoneAuth.js
import { useState, useRef } from 'react'
import {
  auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from '../services/firebase'
import { verifyFirebaseToken } from '../services/api'

export function usePhoneAuth(onSuccess) {
  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const confirmationRef = useRef(null)
  const recaptchaRef = useRef(null)

  const setupRecaptcha = () => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      })
    }
    return recaptchaRef.current
  }

  const sendOTP = async (phoneNumber) => {
    setLoading(true)
    setError(null)
    try {
      const verifier = setupRecaptcha()
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier)
      confirmationRef.current = confirmation
      setStep('otp')
    } catch (err) {
      setError(err.message || 'Failed to send OTP')
      recaptchaRef.current = null
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async (otp) => {
    if (!confirmationRef.current) {
      setError('Session expired. Please resend OTP.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await confirmationRef.current.confirm(otp)
      const idToken = await result.user.getIdToken()
      const { data } = await verifyFirebaseToken(idToken)
      localStorage.setItem('jwt_token', data.token)
      if (onSuccess) onSuccess(result.user, data)
    } catch (err) {
      setError('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep('phone')
    setError(null)
    confirmationRef.current = null
    recaptchaRef.current = null
  }

  return { step, loading, error, sendOTP, verifyOTP, reset }
}
