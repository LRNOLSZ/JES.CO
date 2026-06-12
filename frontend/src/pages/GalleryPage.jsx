import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import axios from 'axios'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'
import { Reveal } from '../components/Reveal'

const ALL = 'all'

function GallerySlider({ beforeImage, afterImage, title, category }) {
  const ref   = useRef(null)
  const [pos,  setPos]  = useState(52)
  const [drag, setDrag] = useState(false)

  const move = (clientX) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      <div
        ref={ref}
        onPointerDown={e  => { setDrag(true); move(e.clientX); e.currentTarget.setPointerCapture(e.pointerId) }}
        onPointerMove={e  => drag && move(e.clientX)}
        onPointerUp={()   => setDrag(false)}
        onPointerCancel={() => setDrag(false)}
        style={{
          position:    'relative',
          aspectRatio: '3 / 4',
          borderRadius:'14px',
          overflow:    'hidden',
          cursor:      'ew-resize',
          userSelect:  'none',
          touchAction: 'none',
          border:      '1px solid var(--hair)',
          background:  'var(--ink-2)',
        }}
      >
        {/* AFTER layer */}
        {afterImage
          ? <img src={afterImage} alt="After" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div className="ph" style={{ position: 'absolute', inset: 0, borderRadius: 0, border: 'none' }}><span className="ph-tag" style={{ left: 'auto', right: 0, color: 'var(--champ)' }}>After</span></div>
        }

        {/* BEFORE layer — clipped left */}
        <div style={{ position: 'absolute', inset: 0, width: pos + '%', overflow: 'hidden' }}>
          {beforeImage
            ? <img src={beforeImage} alt="Before" style={{ position: 'absolute', inset: 0, width: `${100 / (pos / 100)}%`, height: '100%', objectFit: 'cover', maxWidth: 'none' }} />
            : <div className="ph" style={{ position: 'absolute', inset: 0, borderRadius: 0, border: 'none', background: 'repeating-linear-gradient(135deg, rgba(28,21,15,0.06) 0px, rgba(28,21,15,0.06) 2px, transparent 2px, transparent 12px), var(--ink-2)' }}><span className="ph-tag">Before</span></div>
          }
        </div>

        {/* Divider */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: pos + '%', width: '1px', background: 'linear-gradient(transparent, var(--champ), transparent)', pointerEvents: 'none' }} />

        {/* Handle */}
        <div style={{
          position:     'absolute', top: '50%', left: pos + '%',
          transform:    'translate(-50%,-50%)',
          width:        '36px', height: '36px', borderRadius: '50%',
          border:       '1.5px solid var(--champ)',
          background:   'color-mix(in srgb, var(--ink) 78%, transparent)',
          backdropFilter:'blur(8px)',
          display:      'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents:'none',
        }}>
          <svg viewBox="0 0 20 20" width="12" height="12" fill="none">
            <path d="M7 5l-4 5 4 5" stroke="var(--champ)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13 5l4 5-4 5" stroke="var(--champ)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* B/A labels */}
        <span style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', fontFamily: 'var(--sans)', fontSize: '0.55rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--taupe)', background: 'color-mix(in srgb, var(--ink) 72%, transparent)', padding: '0.18rem 0.5rem', borderRadius: '4px' }}>Before</span>
        <span style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', fontFamily: 'var(--sans)', fontSize: '0.55rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--champ)', background: 'color-mix(in srgb, var(--ink) 72%, transparent)', padding: '0.18rem 0.5rem', borderRadius: '4px' }}>After</span>
      </div>

      {(title || category) && (
        <div>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '0.58rem', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--champ)' }}>{category}</p>
          <p className="serif ital" style={{ fontSize: '1rem', color: 'var(--bone)', marginTop: '0.22rem' }}>{title}</p>
        </div>
      )}
    </div>
  )
}

export default function GalleryPage() {
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState(ALL)

  useEffect(() => {
    window.scrollTo(0, 0)
    axios.get('/api/gallery/')
      .then(r => setItems(r.data))
      .finally(() => setLoading(false))
  }, [])

  const categories = [ALL, ...new Set(items.map(i => i.category_display))]
  const filtered   = activeTab === ALL ? items : items.filter(i => i.category_display === activeTab)

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--ink)' }}>
      <JescoNavbar />

      <main style={{ flex: 1, paddingTop: '7rem', paddingBottom: 'clamp(4rem,8vw,7rem)' }}>
        <div className="wrap">

          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ marginBottom: '3rem' }}
          >
            <p style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--champ)', marginBottom: '0.6rem' }}>Portfolio</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <h1 className="serif" style={{ fontSize: 'clamp(2.2rem,7vw,4rem)', color: 'var(--bone)' }}>
                All <span className="ital metal-text">Transformations</span>
              </h1>
              <Link to="/studio" style={{ fontFamily: 'var(--sans)', fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--taupe-mut)', textDecoration: 'none' }}>
                ← Back to Studio
              </Link>
            </div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '0.88rem', fontWeight: 300, color: 'var(--taupe)', marginTop: '0.75rem', lineHeight: 1.7, maxWidth: '26rem' }}>
              Every look. Every transformation. Drag to reveal.
            </p>
            <div style={{ width: '52px', height: '1px', background: 'var(--metal)', marginTop: '1.4rem' }} />
          </motion.div>

          {/* Filter tabs */}
          {categories.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  style={{
                    fontFamily:    'var(--sans)',
                    fontSize:      '0.62rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    padding:       '0.45rem 1.2rem',
                    borderRadius:  '9999px',
                    border:        `1px solid ${activeTab === cat ? 'var(--champ)' : 'var(--hair)'}`,
                    background:    activeTab === cat ? 'color-mix(in srgb, var(--champ) 12%, transparent)' : 'transparent',
                    color:         activeTab === cat ? 'var(--champ)' : 'var(--taupe-mut)',
                    cursor:        'pointer',
                    transition:    'all 0.3s',
                    outline:       'none',
                  }}
                >
                  {cat === ALL ? 'All' : cat}
                </button>
              ))}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid var(--hair)', borderTopColor: 'var(--champ)', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <span style={{ fontFamily: 'var(--sans)', fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--taupe-mut)' }}>
                No transformations published yet
              </span>
            </div>
          ) : (
            <motion.div
              layout
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px,100%),1fr))', gap: '2rem' }}
            >
              {filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <GallerySlider
                    beforeImage={item.before_image}
                    afterImage={item.after_image}
                    title={item.title}
                    category={item.category_display}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <JescoFooter />
    </div>
  )
}
