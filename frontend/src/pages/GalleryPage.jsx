import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import Navbar          from '../components/Navbar'
import Footer          from '../components/Footer'
import BeforeAfterSlider from '../components/BeforeAfterSlider'

const ALL = 'all'

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
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--dark-base)' }}>
      <Navbar />

      <main style={{ flex: 1, paddingTop: '6rem', paddingBottom: '6rem', width: '100%' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem', width: '100%' }}>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ textAlign: 'center', marginBottom: '2.5rem' }}
          >
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.65rem', letterSpacing: '0.45em',
              textTransform: 'uppercase', color: 'var(--gold)',
              marginBottom: '1rem',
            }}>
              Portfolio
            </p>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize:   'clamp(2.2rem, 7vw, 4rem)',
              color:      'var(--text-primary)',
            }}>
              All Transformations
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize:   '0.9rem', fontWeight: 300,
              color:      'var(--text-muted)', marginTop: '1rem',
              lineHeight: 1.7, maxWidth: '26rem', margin: '1rem auto 0',
            }}>
              Every look. Every transformation. Drag to reveal.
            </p>
          </motion.div>

          {/* Filter tabs */}
          {categories.length > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.5rem', flexWrap: 'wrap',
              marginBottom: '2.5rem',
            }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  style={{
                    fontFamily:    "'DM Sans', sans-serif",
                    fontSize:      '0.65rem', letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    padding:       '0.5rem 1.25rem',
                    borderRadius:  '9999px',
                    border:        `1px solid ${activeTab === cat ? 'var(--gold)' : 'var(--glass-border)'}`,
                    background:    activeTab === cat ? 'var(--gold)' : 'var(--glass-bg)',
                    color:         activeTab === cat ? '#000' : 'var(--text-muted)',
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
              <div style={{
                width: '2rem', height: '2rem', borderRadius: '50%',
                border: '2px solid var(--glass-border)',
                borderTopColor: 'var(--gold)',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          ) : filtered.length === 0 ? (
            <p style={{
              textAlign: 'center', padding: '5rem 0',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.8rem', letterSpacing: '0.2em',
              textTransform: 'uppercase', color: 'var(--text-muted)',
            }}>
              No transformations published yet
            </p>
          ) : (
            <motion.div
              layout
              style={{
                display: 'flex', flexWrap: 'wrap',
                justifyContent: 'center', gap: '2rem',
              }}
            >
              {filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  style={{ width: 'min(300px, 85%)' }}
                >
                  <BeforeAfterSlider
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

      <Footer />
    </div>
  )
}
