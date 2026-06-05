// backend/src/utils/currencyRates.js
// Supported currencies with symbols
const CURRENCIES = {
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

// Fetch live exchange rates from open.er-api.com (free, no key needed)
async function getLiveRates(baseCurrency = 'INR') {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`)
    const data = await res.json()
    if (data.result === 'success') {
      return { rates: data.rates, base: baseCurrency, timestamp: data.time_last_update_unix }
    }
  } catch (_) {}
  // Fallback static rates relative to INR
  return {
    base: 'INR',
    rates: { INR:1, USD:0.012, EUR:0.011, GBP:0.0094, AED:0.044, SGD:0.016, AUD:0.018, CAD:0.016, JPY:1.78 },
    timestamp: Date.now() / 1000
  }
}

module.exports = { CURRENCIES, getLiveRates }
