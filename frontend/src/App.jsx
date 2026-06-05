// src/App.jsx
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

import LoginPage from './components/auth/LoginPage'
import SignUpPage from './components/auth/SignUpPage'
import ForgotPasswordPage from './components/auth/ForgotPasswordPage'
import PhoneAuthPage from './components/auth/PhoneAuthPage'
import DashboardPage from './components/dashboard/DashboardPage'
import ExpensesPage from './components/expenses/ExpensesPage'
import IncomePage from './components/income/IncomePage'
import RecurringPage    from './components/recurring/RecurringPage'
import CurrencySettings from './components/settings/CurrencySettings'
import AppLayout from './components/common/AppLayout'
import LoadingScreen from './components/common/LoadingScreen'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
            <Route path="/phone-auth" element={<PublicRoute><PhoneAuthPage /></PublicRoute>} />

            {/* Protected routes */}
            <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="income" element={<IncomePage />} />
              <Route path="recurring"       element={<RecurringPage />} />
              <Route path="settings/currency" element={<CurrencySettings />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              borderRadius: '12px',
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  )
}
