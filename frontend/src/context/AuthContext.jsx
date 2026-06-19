// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from '../services/firebase'
import { verifyFirebaseToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [dbUser, setDbUser]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const syncedRef = useRef(false) // ← prevents multiple syncs

  const syncWithBackend = useCallback(async (firebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken()
      const { data } = await verifyFirebaseToken(idToken)
      localStorage.setItem('jwt_token', data.token)
      setDbUser(data.user)
      return data
    } catch (err) {
      console.warn('Backend sync failed:', err.message)
      // Don't throw — let user in anyway
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Prevent running twice (React StrictMode)
      if (syncedRef.current) return
      syncedRef.current = true

      try {
        if (firebaseUser) {
          setUser(firebaseUser)
          await syncWithBackend(firebaseUser)
        } else {
          setUser(null)
          setDbUser(null)
          localStorage.removeItem('jwt_token')
        }
      } catch (_) {
        // Never crash here
      } finally {
        setLoading(false)
        // Reset after short delay to allow re-auth on logout/login
        setTimeout(() => { syncedRef.current = false }, 2000)
      }
    })
    return () => unsubscribe()
  }, [syncWithBackend])

  const loginWithEmail = async (email, password) => {
    setAuthError(null)
    syncedRef.current = false
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      await syncWithBackend(result.user)
      return result
    } catch (err) {
      setAuthError(formatAuthError(err))
      throw err
    }
  }

  const signUpWithEmail = async (email, password, name) => {
    setAuthError(null)
    syncedRef.current = false
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName: name })
      await syncWithBackend(result.user)
      return result
    } catch (err) {
      setAuthError(formatAuthError(err))
      throw err
    }
  }

  const loginWithGoogle = async () => {
    setAuthError(null)
    syncedRef.current = false
    try {
      const result = await signInWithPopup(auth, googleProvider)
      await syncWithBackend(result.user)
      return result
    } catch (err) {
      setAuthError(formatAuthError(err))
      throw err
    }
  }

  const resetPassword = async (email) => {
    setAuthError(null)
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (err) {
      setAuthError(formatAuthError(err))
      throw err
    }
  }

  const logout = async () => {
    syncedRef.current = false
    await signOut(auth)
    localStorage.removeItem('jwt_token')
    setUser(null)
    setDbUser(null)
  }

  const clearError = () => setAuthError(null)

  return (
    <AuthContext.Provider value={{
      user, dbUser, setDbUser, loading, authError, clearError,
      loginWithEmail, signUpWithEmail, loginWithGoogle,
      resetPassword, logout, syncWithBackend,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function formatAuthError(err) {
  const map = {
    'auth/user-not-found':        'No account found with this email.',
    'auth/wrong-password':        'Incorrect password. Please try again.',
    'auth/email-already-in-use':  'An account with this email already exists.',
    'auth/weak-password':         'Password must be at least 6 characters.',
    'auth/invalid-email':         'Invalid email address.',
    'auth/too-many-requests':     'Too many attempts. Please try again later.',
    'auth/popup-closed-by-user':  'Sign-in popup was closed.',
    'auth/network-request-failed':'Network error. Check your connection.',
  }
  return map[err.code] || err.message || 'Authentication failed.'
}