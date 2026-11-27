/** Formats a numeric price (or numeric string, as DRF returns decimals) with its currency label. */
export function formatPrice(raw, currencyLabel) {
  if (raw === null || raw === undefined || raw === '') return ''
  return `${currencyLabel} ${Number(raw).toFixed(2)}`
}

export const isDigitalProduct = (item) => item?.product_type === 'digital'

/**
 * Which currency THIS product's price is quoted in, for a given region.
 *
 * ⚠️ Single source of truth for the frontend. This rule also exists server-side
 * in products/views.py's charge handler, and the two MUST agree — the server
 * recomputes the expected total independently and holds the customer's money
 * for manual review on any mismatch.
 *
 * Previously this logic was copy-pasted into ProductLinePage and CartPage, and
 * the product detail page would have been a third copy. Centralised here so
 * there is one frontend definition to keep in step with the backend instead of
 * three drifting ones.
 *
 * Digital products are priced in GHS worldwide — one price, no regional
 * variant. A physical product is quoted in USD only when the visitor is in the
 * USA *and* a price_usd is actually set; without one it falls back to its GHS
 * price, and that price is still GHS.
 */
export function productCurrency(item, region) {
  if (isDigitalProduct(item)) return 'GHS'
  return (region === 'usa' && item?.price_usd) ? 'USD' : 'GHS'
}

/** The raw numeric price to use for this product in this region, unconverted. */
export function productUnitPrice(item, region) {
  return productCurrency(item, region) === 'USD' ? item.price_usd : item?.price
}

/** Ready-to-render price string, e.g. "GHS 80.00" or "USD 10.00". */
export function productPriceLabel(item, region) {
  return formatPrice(productUnitPrice(item, region), productCurrency(item, region))
}
