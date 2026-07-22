/** Formats a numeric price (or numeric string, as DRF returns decimals) with its currency label. */
export function formatPrice(raw, currencyLabel) {
  if (raw === null || raw === undefined || raw === '') return ''
  return `${currencyLabel} ${Number(raw).toFixed(2)}`
}
