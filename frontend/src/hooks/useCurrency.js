// src/hooks/useCurrency.js
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

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

// Fallback rates relative to INR
const FALLBACK_RATES = {
  INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0094,
  AED: 0.044, SGD: 0.016, AUD: 0.018, CAD: 0.016, JPY: 1.78
}

export function useCurrency() {
  const [currency, setCurrencyState] = useState(
    () => localStorage.getItem('preferred_currency') || 'INR'
  )
  const [rates, setRates]     = useState(FALLBACK_RATES)
  const [loading, setLoading] = useState(false)

  const fetchRates = useCallback(async (base = 'INR') => {
    setLoading(true)
    try {
      const res  = await fetch(`https://open.er-api.com/v6/latest/${base}`)
      const data = await res.json()
      if (data.result === 'success') {
        setRates(data.rates)
      } else {
        setRates(FALLBACK_RATES)
      }
    } catch (_) {
      setRates(FALLBACK_RATES)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRates('INR') }, [fetchRates])

  const setCurrency = (code) => {
    setCurrencyState(code)
    localStorage.setItem('preferred_currency', code)
    toast.success(`Currency changed to ${CURRENCIES[code]?.name}`)
  }

  const format = (amount) => {
    const info = CURRENCIES[currency] || CURRENCIES.INR
    const rate = currency === 'INR' ? 1 : (rates[currency] || 1)
    const inrRate = rates['INR'] || 1
    const converted = (amount / inrRate) * rate
    return `${info.symbol}${converted.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  }

  const convert = (amount, from, to) => {
    const fromRate = rates[from] || 1
    const toRate   = rates[to]   || 1
    return parseFloat(((amount / fromRate) * toRate).toFixed(2))
  }

  return { currency, setCurrency, rates, loading, format, convert, CURRENCIES }
}