import { useState, useEffect } from 'react'
import axios from 'axios'

// Module-level cache — all components share one fetch per page load
let _cached  = null
let _promise = null

/** Returns the current GHS→USD rate (or null while loading / unavailable). Display-only. */
export function useExchangeRate() {
  const [rate, setRate] = useState(_cached)

  useEffect(() => {
    if (_cached !== null) { setRate(_cached); return }
    if (!_promise) {
      _promise = axios.get('/api/exchange-rate/')
        .then(r => { _cached = r.data.ghs_to_usd ?? null; return _cached })
        .catch(() => { _cached = null; return null })
    }
    _promise.then(setRate)
  }, [])

  return rate
}

/** Formats a GHS numeric amount as a "≈ $X" estimate string, or '' if the rate isn't available. */
export function formatUsdEstimate(ghsAmount, rate) {
  if (!rate || !ghsAmount) return ''
  return `≈ $${(ghsAmount * rate).toFixed(0)}`
}
