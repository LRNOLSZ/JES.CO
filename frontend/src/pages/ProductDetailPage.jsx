import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'
import { ArrowIcon } from '../components/Reveal'
import { useCart } from '../context/CartContext'
import { useRegion } from '../context/RegionContext'
import { isDigitalProduct, productPriceLabel, productUnitPrice } from '../utils/price'
import SEO from '../components/SEO'

const STOCK = {
  in_stock:     { color: '#2d6a4f', label: 'In Stock'     },
  out_of_stock: { color: '#9b1c1c', label: 'Out of Stock' },
  coming_soon:  { color: '#92400e', label: 'Coming Soon'  },
}

const LOW_STOCK_THRESHOLD = 5
const LOW_STOCK_COLOR = '#c2410c'

// TODO: swap jes-co.vercel.app for the real jes.co domain once purchased
const SITE = 'https://jes-co.vercel.app'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
})

function PageShell({ children }) {
  return (
    <div style={{ background: 'var(--ink)', minHeight: '100vh' }}>
      <JescoNavbar overDark />
      {children}
      <JescoFooter />
    </div>
  )
}

export default function ProductDetailPage() {
  const { slug } = useParams()
  const { addToCart } = useCart()
  const { region } = useRegion()

  const [item, setItem]       = useState(null)
  const [state, setState]     = useState('loading')  // loading | found | not_found | error
  const [activeImg, setActive] = useState(0)
  const [added, setAdded]     = useState(false)

  useEffect(() => {
    let cancelled = false
    setState('loading')
    axios.get(`/api/products/by-slug/${encodeURIComponent(slug)}/`)
      .then(r => {
        if (cancelled) return
        setItem(r.data)
        setActive(0)
        setState('found')
      })
      .catch(err => {
        if (cancelled) return
        setState(err.response?.status === 404 ? 'not_found' : 'error')
      })
    return () => { cancelled = true }
  }, [slug])

  // Loading and not-found states carry their own <SEO> on purpose. Leaving them
  // bare means a slow connection briefly shows the previous page's title, and a
  // crawler that gives up early records that stale title as this page's — a real
  // bug already fixed once on the course detail page.
  if (state === 'loading') {
    return (
      <PageShell>
        <SEO title="Loading — JES.CO Shop" />
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid var(--hair)', borderTopColor: 'var(--champ)', animation: 'spin 0.8s linear infinite' }} />
        </div>
      </PageShell>
    )
  }

  if (state !== 'found') {
    return (
      <PageShell>
        <SEO title="Product Not Found — JES.CO Shop" />
        <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
          <p className="serif" style={{ fontSize: '1.5rem', color: 'var(--taupe)' }}>
            {state === 'not_found' ? 'Product not found' : "Couldn't load this product"}
          </p>
          <Link to="/products/makeup" className="btn btn-gold">Browse the shop</Link>
        </div>
      </PageShell>
    )
  }

  const isDigital  = isDigitalProduct(item)
  const isLowStock = !isDigital && item.stock_status === 'in_stock'
                     && item.quantity > 0 && item.quantity <= LOW_STOCK_THRESHOLD
  const stock = isDigital
    ? { color: 'var(--champ)', label: 'Instant download' }
    : isLowStock
      ? { color: LOW_STOCK_COLOR, label: `Only ${item.quantity} left` }
      : (STOCK[item.stock_status] || STOCK.coming_soon)

  const canBuy  = isDigital || item.stock_status === 'in_stock'
  const soldOut = !isDigital && item.stock_status === 'out_of_stock'

  // Primary image first, then any gallery extras. ProductItem.image remains the
  // thumbnail used in listings and the cart; `images` is purely additive, so a
  // product with none simply shows the single photo.
  const gallery = [
    ...(item.image_url ? [{ url: item.image_url, alt: item.name }] : []),
    ...(item.images || []).map(i => ({ url: i.image_url, alt: i.alt_text || item.name })),
  ].filter(g => g.url)

  const shown = gallery[activeImg] || gallery[0]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.name,
    description: item.description,
    ...(shown ? { image: shown.url } : {}),
    category: item.category_display,
    offers: {
      '@type': 'Offer',
      url: `${SITE}/product/${item.slug}`,
      price: productUnitPrice(item, region),
      priceCurrency: region === 'usa' && item.price_usd && !isDigital ? 'USD' : 'GHS',
      availability: canBuy ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  }

  function handleAdd() {
    if (!canBuy) return
    addToCart(item)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <PageShell>
      <SEO
        title={`${item.name} — JES.CO Shop`}
        description={(item.description || '').slice(0, 155)}
        jsonLd={jsonLd}
      />

      <section className="wrap" style={{ paddingTop: '7rem', paddingBottom: '5rem' }}>
        {/* Breadcrumb — category label comes from the API (category_display), not
            a hardcoded map, so it keeps working when categories become
            admin-managed in Phase C3. */}
        <motion.nav {...fadeUp()} style={{ marginBottom: '2rem', fontFamily: 'var(--sans)', fontSize: '0.75rem', color: 'var(--taupe-mut)' }}>
          <Link to={`/products/${item.category}`} style={{ color: 'var(--champ)', textDecoration: 'none' }}>
            {item.category_display}
          </Link>
          <span style={{ margin: '0 0.5rem' }}>/</span>
          <span>{item.name}</span>
        </motion.nav>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '2.5rem' }} className="product-detail-grid">
          {/* Gallery */}
          <motion.div {...fadeUp(0.05)}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', borderRadius: '16px', overflow: 'hidden', background: 'var(--ink-2)', border: '1px solid var(--hair)', filter: soldOut ? 'grayscale(0.7)' : 'none' }}>
              {shown ? (
                <img src={shown.url} alt={shown.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="ph" style={{ width: '100%', height: '100%' }}><span className="ph-tag">Product Image</span></div>
              )}
              <span style={{
                position: 'absolute', top: '1rem', left: '1rem', background: stock.color,
                color: '#FBF7F0', fontFamily: 'var(--sans)', fontSize: '0.55rem',
                letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600,
                padding: '0.3rem 0.7rem', borderRadius: '9999px',
              }}>
                {stock.label}
              </span>
            </div>

            {/* Thumbnail strip — only when there's more than one photo */}
            {gallery.length > 1 && (
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
                {gallery.map((g, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActive(idx)}
                    aria-label={`View image ${idx + 1} of ${gallery.length}`}
                    style={{
                      width: '68px', height: '68px', padding: 0, borderRadius: '10px',
                      overflow: 'hidden', cursor: 'pointer', background: 'var(--ink-2)',
                      border: `1px solid ${idx === activeImg ? 'var(--champ)' : 'var(--hair)'}`,
                      opacity: idx === activeImg ? 1 : 0.65, transition: 'all 0.25s',
                    }}
                  >
                    <img src={g.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div {...fadeUp(0.12)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h1 className="serif" style={{ fontSize: 'clamp(1.7rem,3.4vw,2.5rem)', color: 'var(--bone)', lineHeight: 1.15 }}>
              {item.name}
            </h1>

            <p style={{ fontFamily: 'var(--sans)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--champ)' }}>
              {productPriceLabel(item, region)}
            </p>

            {isDigital && (
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.78rem', color: 'var(--taupe-mut)' }}>
                Digital download — priced in GHS worldwide. Yours permanently once purchased.
              </p>
            )}

            <p style={{ fontFamily: 'var(--sans)', fontSize: '0.92rem', fontWeight: 300, color: 'var(--taupe)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {item.description}
            </p>

            {/* Phase C2 slot: the size picker belongs here, between the
                description and the add-to-cart button. Laid out this way now so
                adding it doesn't mean rearranging the page. */}

            <button
              onClick={handleAdd}
              disabled={!canBuy}
              className={canBuy ? 'btn btn-gold' : ''}
              style={{
                marginTop: '0.5rem', width: '100%', justifyContent: 'center',
                ...(canBuy ? {} : {
                  background: 'transparent', border: '1px solid var(--hair)',
                  color: 'var(--taupe-mut)', cursor: 'not-allowed',
                  padding: '0.9rem 1rem', borderRadius: '9999px',
                  fontFamily: 'var(--sans)', fontSize: '0.78rem',
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                }),
              }}
            >
              {!canBuy
                ? (item.stock_status === 'coming_soon' ? 'Coming Soon' : 'Out of Stock')
                : added ? '✓ Added to cart' : <>Add to Cart <ArrowIcon /></>}
            </button>

            {added && (
              <Link to="/cart" style={{ fontFamily: 'var(--sans)', fontSize: '0.8rem', color: 'var(--champ)', textAlign: 'center' }}>
                View cart →
              </Link>
            )}
          </motion.div>
        </div>
      </section>
    </PageShell>
  )
}
