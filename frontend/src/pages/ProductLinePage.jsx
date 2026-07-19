import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'
import { Reveal, SectionHead, ArrowIcon } from '../components/Reveal'
import { useCart } from '../context/CartContext'
import { useRegion } from '../context/RegionContext'
import { formatPrice } from '../utils/price'

const META = {
  makeup:      { label: 'Makeup Sets',        sub: 'Pigment-rich. Studio-grade. Built for the woman who never blends in.',    eyebrow: 'The Collection' },
  skincare:    { label: 'Skincare Sets',       sub: 'Formulated for radiance. Science-backed, luxury-finished.',              eyebrow: 'The Collection' },
  collections: { label: 'Curated Collections',sub: 'Seasonal. Intentional. Curated for the connoisseur.',                   eyebrow: 'The Collection' },
}

const STOCK = {
  in_stock:    { color: '#2d6a4f', label: 'In Stock'    },
  out_of_stock:{ color: '#9b1c1c', label: 'Out of Stock' },
  coming_soon: { color: '#92400e', label: 'Coming Soon'  },
}

export default function ProductLinePage() {
  const { category }          = useParams()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const { addToCart }         = useCart()
  const [added, setAdded]     = useState({})
  const { region }            = useRegion()

  const meta = META[category] || { label: 'Products', sub: '', eyebrow: 'The Collection' }

  const handleAdd = (item) => {
    addToCart(item)
    setAdded(prev => ({ ...prev, [item.id]: true }))
    setTimeout(() => setAdded(prev => ({ ...prev, [item.id]: false })), 1500)
  }

  useEffect(() => {
    setLoading(true)
    axios.get(`/api/products/?category=${category}`)
      .then(r => setItems(r.data))
      .finally(() => setLoading(false))
  }, [category])

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: 'var(--ink)', color: 'var(--bone)' }}>
      <JescoNavbar />

      {/* ── Page header ── */}
      <section style={{
        paddingTop:    'clamp(8rem,16vw,11rem)',
        paddingBottom: 'clamp(4rem,8vw,6rem)',
        background:    'var(--ink-2)',
        borderBottom:  '1px solid var(--hair)',
        position:      'relative',
        overflow:      'hidden',
      }}>
        {/* plum glow */}
        <div style={{
          position:   'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 55% 70% at 15% 60%, var(--plum), transparent 65%)',
          opacity:    'var(--glow-plum)',
        }} />

        <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
          <Reveal>
            <Link
              to="/"
              style={{
                display:       'inline-flex',
                alignItems:    'center',
                gap:           '0.4rem',
                fontFamily:    'var(--sans)',
                fontSize:      '0.62rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color:         'var(--taupe-mut)',
                marginBottom:  '2.2rem',
                transition:    'color 0.3s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--champ)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--taupe-mut)')}
            >
              ← JES.CO
            </Link>
          </Reveal>

          <SectionHead
            eyebrow={meta.eyebrow}
            title={<span className="ital metal-text">{meta.label}</span>}
            sub={meta.sub}
          />

          <Reveal delay={0.1}>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '0.78rem', fontWeight: 300, color: 'var(--taupe-mut)', marginTop: '1.4rem' }}>
              {region === 'usa'
                ? 'Prices shown in USD.'
                : 'Prices shown in GHS.'}{' '}
              Shopping from {region === 'usa' ? 'Ghana' : 'outside Ghana'}? Switch to {region === 'usa' ? 'GHS' : 'USD'} in the menu above →
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Product grid ── */}
      <section style={{ padding: 'clamp(4rem,9vw,7rem) 0' }}>
        <div className="wrap">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
              <div style={{
                width: '2rem', height: '2rem', borderRadius: '50%',
                border: '2px solid var(--hair)',
                borderTopColor: 'var(--champ)',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>

          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '6rem 0' }}>
              <p style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontStyle: 'italic', color: 'var(--taupe)', marginBottom: '0.75rem' }}>
                Coming Soon
              </p>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.85rem', fontWeight: 300, color: 'var(--taupe-mut)', lineHeight: 1.8 }}>
                New products are being curated. Check back soon.
              </p>
            </div>

          ) : (
            <div className="product-grid" style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap:                 '1.8rem',
            }}>
              {items.map((item, i) => (
                <Reveal key={item.id} delay={i * 0.07}>
                  <ProductCard
                    item={item}
                    added={added[item.id]}
                    onAdd={() => handleAdd(item)}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <JescoFooter />
    </div>
  )
}

function ProductCard({ item, added, onAdd }) {
  const [hovered, setHovered] = useState(false)
  const { region } = useRegion()
  const stock = STOCK[item.stock_status] || STOCK.coming_soon
  const canBuy = item.stock_status === 'in_stock'
  const soldOut = item.stock_status === 'out_of_stock'
  const displayPrice = formatPrice(
    region === 'usa' && item.price_usd ? item.price_usd : item.price,
    region === 'usa' ? 'USD' : 'GHS'
  )

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:       'flex',
        flexDirection: 'column',
        background:    'var(--ink-3)',
        border:        `1px solid ${hovered ? 'color-mix(in srgb, var(--champ) 40%, transparent)' : 'var(--hair)'}`,
        borderRadius:  '18px',
        overflow:      'hidden',
        transform:     hovered ? 'translateY(-6px)' : 'none',
        boxShadow:     hovered ? '0 20px 50px rgba(28,21,15,0.1)' : '0 2px 12px rgba(28,21,15,0.04)',
        transition:    'transform 0.4s var(--ease), border-color 0.4s, box-shadow 0.4s',
        filter:        soldOut ? 'grayscale(0.8)' : 'none',
        opacity:       soldOut ? 0.55 : 1,
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', overflow: 'hidden', background: 'var(--ink-2)' }}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s var(--ease)', transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
          />
        ) : (
          <div className="ph" style={{ width: '100%', height: '100%' }}>
            <span className="ph-tag">Product Image</span>
          </div>
        )}

        {/* Stock badge */}
        <span style={{
          position:      'absolute',
          top:           '0.75rem',
          left:          '0.75rem',
          background:    stock.color,
          color:         '#FBF7F0',
          fontFamily:    'var(--sans)',
          fontSize:      '0.52rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontWeight:    600,
          padding:       '0.28rem 0.65rem',
          borderRadius:  '9999px',
        }}>
          {stock.label}
        </span>

        {/* Gold top accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--metal)' }} />
      </div>

      {/* Info */}
      <div style={{ padding: '1.6rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem' }}>
        <h3 className="serif" style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--bone)', lineHeight: 1.2 }}>
          {item.name}
        </h3>

        {displayPrice && (
          <span style={{ fontFamily: 'var(--sans)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--champ)' }}>
            {displayPrice}
          </span>
        )}

        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.84rem', fontWeight: 300, color: 'var(--taupe)', lineHeight: 1.75, flex: 1 }}>
          {item.description}
        </p>

        <button
          onClick={() => canBuy && onAdd()}
          disabled={!canBuy}
          className={canBuy ? 'btn btn-gold' : ''}
          style={{
            marginTop:     '0.9rem',
            width:         '100%',
            justifyContent:'center',
            ...(canBuy ? {} : {
              padding:       '0.85rem',
              borderRadius:  '9999px',
              border:        '1px solid var(--hair)',
              background:    'transparent',
              color:         'var(--taupe-mut)',
              fontFamily:    'var(--sans)',
              fontSize:      '0.65rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight:    600,
              cursor:        'not-allowed',
            }),
          }}
        >
          {!canBuy
            ? (item.stock_status === 'coming_soon' ? 'Coming Soon' : 'Out of Stock')
            : added ? '✓ Added' : <>Add to Cart <ArrowIcon /></>}
        </button>
      </div>
    </div>
  )
}
