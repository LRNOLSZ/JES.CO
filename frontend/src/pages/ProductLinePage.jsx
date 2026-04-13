import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'

const META = {
  makeup:      { label: 'Makeup Sets',         sub: 'Pigment-rich. Studio-grade.',          accent: 'var(--purple)' },
  skincare:    { label: 'Skincare Sets',        sub: 'Formulated for radiance.',             accent: '#1c6b4a'       },
  collections: { label: 'Curated Collections', sub: 'Seasonal. Intentional.',               accent: '#8a5a1e'       },
}

const STOCK_STYLES = {
  in_stock:    { bg: '#16a34a', label: 'In Stock'    },
  out_of_stock:{ bg: '#dc2626', label: 'Out of Stock' },
  coming_soon: { bg: '#d97706', label: 'Coming Soon'  },
}

export default function ProductLinePage() {
  const { category }          = useParams()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)

  const meta = META[category] || { label: 'Products', sub: '', accent: 'var(--purple)' }

  useEffect(() => {
    window.scrollTo(0, 0)
    setLoading(true)
    axios.get(`/api/products/?category=${category}`)
      .then(r => setItems(r.data))
      .finally(() => setLoading(false))
  }, [category])

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: 'var(--dark-base)', color: 'var(--text-primary)' }}>
      <JescoNavbar />

      {/* ── Page header ── */}
      <section style={{
        paddingTop:   'clamp(7rem, 14vw, 10rem)',
        paddingBottom:'clamp(3rem, 6vw, 5rem)',
        padding:      'clamp(7rem, 14vw, 10rem) 1.5rem clamp(3rem, 6vw, 5rem)',
        textAlign:    'center',
        position:     'relative',
        overflow:     'hidden',
        background:   'linear-gradient(180deg, #1a0d3d 0%, var(--dark-base) 100%)',
      }}>
        <div style={{
          position:     'absolute',
          top:          '50%',
          left:         '50%',
          transform:    'translate(-50%,-50%)',
          width:        '600px',
          height:       '400px',
          borderRadius: '50%',
          background:   'radial-gradient(ellipse, rgba(96,38,158,0.2) 0%, transparent 70%)',
          pointerEvents:'none',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          style={{ position: 'relative' }}
        >
          <Link
            to="/#products"
            style={{
              display:       'inline-flex',
              alignItems:    'center',
              gap:           '0.4rem',
              fontFamily:    "'DM Sans', sans-serif",
              fontSize:      '0.62rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color:         'var(--text-muted)',
              textDecoration:'none',
              marginBottom:  '1.5rem',
              transition:    'color 0.3s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ← Back to JES.CO
          </Link>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize:   'clamp(2.2rem, 7vw, 4.5rem)',
            fontWeight: 700,
            color:      'var(--text-primary)',
            marginBottom:'0.75rem',
          }}>
            {meta.label}
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize:   '0.9rem',
            fontWeight: 300,
            color:      'var(--text-muted)',
            letterSpacing:'0.05em',
          }}>
            {meta.sub}
          </p>

          {/* Decorative accent line */}
          <div style={{
            width:      '48px',
            height:     '2px',
            background: `linear-gradient(to right, ${meta.accent}, transparent)`,
            margin:     '1.5rem auto 0',
          }} />
        </motion.div>
      </section>

      {/* ── Product grid ── */}
      <section style={{ padding: 'clamp(3rem, 8vw, 6rem) 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
              <div style={{
                width: '2rem', height: '2rem', borderRadius: '50%',
                border: '2px solid var(--glass-border)',
                borderTopColor: 'var(--gold)',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <p style={{
                fontFamily:    "'Playfair Display', serif",
                fontSize:      '1.4rem',
                color:         'var(--text-muted)',
                marginBottom:  '1rem',
              }}>
                Coming Soon
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize:   '0.85rem',
                color:      'var(--text-muted)',
                fontWeight: 300,
              }}>
                New products are being curated. Check back soon.
              </p>
            </div>
          ) : (
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap:                 '2rem',
            }}>
              {items.map((item, i) => {
                const stock = STOCK_STYLES[item.stock_status] || STOCK_STYLES.coming_soon
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: i * 0.07 }}
                    whileHover={{ y: -6, boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}
                    style={{
                      background:   'var(--dark-surface)',
                      borderRadius: '16px',
                      overflow:     'hidden',
                      border:       '1px solid var(--glass-border)',
                      transition:   'transform 0.35s, box-shadow 0.35s',
                    }}
                  >
                    {/* Product image */}
                    <div style={{
                      width:    '100%',
                      height:   '240px',
                      overflow: 'hidden',
                      background:'#0C0A14',
                      position: 'relative',
                    }}>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--text-muted)',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase',
                        }}>
                          No Image
                        </div>
                      )}
                      {/* Stock badge */}
                      <div style={{
                        position:      'absolute',
                        top:           '0.75rem',
                        right:         '0.75rem',
                        background:    stock.bg,
                        color:         '#fff',
                        fontFamily:    "'DM Sans', sans-serif",
                        fontSize:      '0.58rem',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        padding:       '0.25rem 0.75rem',
                        borderRadius:  '9999px',
                        fontWeight:    600,
                      }}>
                        {stock.label}
                      </div>
                    </div>

                    {/* Product info */}
                    <div style={{ padding: '1.5rem' }}>
                      <h3 style={{
                        fontFamily:   "'Playfair Display', serif",
                        fontSize:     '1.15rem',
                        color:        'var(--text-primary)',
                        marginBottom: '0.5rem',
                      }}>
                        {item.name}
                      </h3>
                      {item.price && (
                        <div style={{
                          fontFamily:    "'DM Sans', sans-serif",
                          fontSize:      '0.8rem',
                          fontWeight:    600,
                          color:         'var(--gold)',
                          letterSpacing: '0.05em',
                          marginBottom:  '0.75rem',
                        }}>
                          {item.price}
                        </div>
                      )}
                      <p style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize:   '0.82rem',
                        fontWeight: 300,
                        color:      'var(--text-muted)',
                        lineHeight: 1.7,
                      }}>
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <JescoFooter />
    </div>
  )
}
