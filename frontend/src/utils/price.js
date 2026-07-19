/** Ensures a price string always shows its currency, even if it was typed
 *  in admin without one (e.g. "80" instead of "GHS 80"). */
export function formatPrice(raw, currencyLabel) {
  if (!raw) return raw
  const str = String(raw).trim()
  return /ghs|usd/i.test(str) ? str : `${currencyLabel} ${str}`
}
