// src/services/api.js
import axios from 'axios'
import { auth } from './firebase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
})

// Attach JWT token to every request
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('jwt_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle 401 — refresh Firebase token and retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const firebaseUser = auth.currentUser
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken(true)
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/verify`,
            { idToken }
          )
          const { token } = res.data
          localStorage.setItem('jwt_token', token)
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }
      } catch (_) {
        localStorage.removeItem('jwt_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────
export const verifyFirebaseToken = (idToken) =>
  api.post('/auth/verify', { idToken })

// ── User ──────────────────────────────────────────
export const getMe = () => api.get('/users/me')
export const updateMe = (data) => api.put('/users/me', data)

// ── Expenses ──────────────────────────────────────
export const getExpenses = (params) => api.get('/expenses', { params })
export const createExpense = (data) => api.post('/expenses', data)
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data)
export const deleteExpense = (id) => api.delete(`/expenses/${id}`)
export const exportCSV = () =>
  api.get('/expenses/export/csv', { responseType: 'blob' })
// ── Incomes ───────────────────────────────────────
export const getIncomes    = (params) => api.get('/incomes', { params })
export const createIncome  = (data)   => api.post('/incomes', data)
export const updateIncome  = (id, data) => api.put(`/incomes/${id}`, data)
export const deleteIncome  = (id)     => api.delete(`/incomes/${id}`)
export default api
