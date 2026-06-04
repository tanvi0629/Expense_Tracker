// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
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
  const [user, setUser] = useState(null)
  const [dbUser, setDbUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  // Exchange Firebase token for our JWT and fetch DB user
  const syncWithBackend = useCallback(async (firebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken()
      const { data } = await verifyFirebaseToken(idToken)
      localStorage.setItem('jwt_token', data.token)
      setDbUser(data.user)
      return data
    } catch (err) {
      console.error('Backend sync error:', err)
      throw err
    }
  }, [])

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          await syncWithBackend(firebaseUser)
        } catch (_) {
          // Backend unavailable — still allow access with Firebase session only
        }
      } else {
        localStorage.removeItem('jwt_token')
        setDbUser(null)
      }
      // Always set loading false regardless of backend status
      setLoading(false)
    })
    return unsubscribe
  }, []) // Empty dependency array — run only once

  // ── Auth actions ──────────────────────────────────
  const loginWithEmail = async (email, password) => {
    setAuthError(null)
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
    await signOut(auth)
    localStorage.removeItem('jwt_token')
    setUser(null)
    setDbUser(null)
  }

  const clearError = () => setAuthError(null)

  const value = {
    user,
    dbUser,
    setDbUser,
    loading,
    authError,
    clearError,
    loginWithEmail,
    signUpWithEmail,
    loginWithGoogle,
    resetPassword,
    logout,
    syncWithBackend,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// ── Error formatting ────────────────────────────────
function formatAuthError(err) {
  const map = {
    'auth/user-not-found':       'No account found with this email.',
    'auth/wrong-password':       'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/invalid-email':        'Invalid email address.',
    'auth/too-many-requests':    'Too many attempts. Please try again later.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  }
  return map[err.code] || err.message || 'Authentication failed.'
}
