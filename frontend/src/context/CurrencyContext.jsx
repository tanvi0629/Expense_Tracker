// frontend/src/context/CurrencyContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
]

const CurrencyContext = createContext(null)

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('currency')
    return CURRENCIES.find(c => c.code === saved) || CURRENCIES[0]
  })

  useEffect(() => {
    localStorage.setItem('currency', currency.code)
  }, [currency])

  const format = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency.code,
      maximumFractionDigits: currency.code === 'JPY' ? 0 : 2,
    }).format(amount || 0)
  }

  const changeCurrency = (code) => {
    const found = CURRENCIES.find(c => c.code === code)
    if (found) setCurrency(found)
  }

  return (
    <CurrencyContext.Provider value={{ currency, currencies: CURRENCIES, changeCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
