// src/hooks/useCurrency.js
import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export const CURRENCIES = {
  INR: { symbol: '₹', name: 'Indian Rupee' },
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
}

export function useCurrency() {
  const [currency, setCurrencyState] = useState(() => localStorage.getItem('preferred_currency') || 'INR')
  const [rates, setRates]   = useState({})
  const [loading, setLoading] = useState(false)

  const fetchRates = useCallback(async (base = currency) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/currency/rates/${base}`)
      setRates(data.rates || {})
    } catch (_) {}
    finally { setLoading(false) }
  }, [currency])

  useEffect(() => { fetchRates(currency) }, [currency])

  const setCurrency = async (code) => {
    setCurrencyState(code)
    localStorage.setItem('preferred_currency', code)
    // Save to backend user profile
    try { await api.put('/users/me', { preferred_currency: code }) } catch (_) {}
  }

  // Format amount in selected currency
  const format = (amount) => {
    const info = CURRENCIES[currency] || CURRENCIES.INR
    const converted = currency === 'INR' ? amount : (amount * (rates[currency] || 1))
    return `${info.symbol}${converted.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  }

  // Convert a specific amount between currencies
  const convert = async (amount, from, to) => {
    try {
      const { data } = await api.post('/currency/convert', { amount, from, to })
      return data.converted
    } catch (_) { return amount }
  }

  return { currency, setCurrency, rates, loading, format, convert, CURRENCIES }
}
