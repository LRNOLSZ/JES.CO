import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import axios from 'axios'
import BeforeAfterSlider from './BeforeAfterSlider'

export default function GallerySection() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/gallery/')
      .then(r => setItems(r.data))
      .finally(() => setLoading(false))
  }, [])

  const preview = items.slice(0, 2)

  return (
    <section id="gallery" style={{
      width:      '100%',
      minHeight:  '100vh',
      background: 'var(--dark-base)',
      display:    'flex',
      alignItems: 'center',
    }}>
      <div style={{
        width:     '100%',
        maxWidth:  '72rem',
        margin:    '0 auto',
        padding:   '6rem 1.5rem',
      }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <p style={{
            fontFamily:    "'DM Sans', sans-serif",
            fontSize:      '0.65rem',
            letterSpacing: '0.45em',
            textTransform: 'uppercase',
            color:         'var(--gold)',
            marginBottom:  '1rem',
          }}>
            Transformations
          </p>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize:   'clamp(2rem, 6vw, 3.5rem)',
            color:      'var(--text-primary)',
          }}>
            The Work
          </h2>
          <p style={{
            fontFamily:  "'DM Sans', sans-serif",
            fontSize:    '0.9rem',
            fontWeight:  300,
            color:       'var(--text-muted)',
            marginTop:   '1rem',
            lineHeight:  1.7,
          }}>
            Drag to reveal.
          </p>
        </motion.div>

        {/* Sliders */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
            <div style={{
              width: '2rem', height: '2rem', borderRadius: '50%',
              border: '2px solid var(--glass-border)',
              borderTopColor: 'var(--gold)',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : preview.length === 0 ? (
          <p style={{
            textAlign: 'center', padding: '4rem 0',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.8rem', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--text-muted)',
          }}>
            No transformations published yet
          </p>
        ) : (
          <div style={{
            display:        'flex',
            flexWrap:       'wrap',
            justifyContent: 'center',
            gap:            '2rem',
          }}>
            {preview.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
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
          </div>
        )}

        {/* See All Work */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            style={{ display: 'flex', justifyContent: 'center', marginTop: '3.5rem' }}
          >
            <Link
              to="/gallery"
              style={{
                padding:       '0.85rem 2.25rem',
                borderRadius:  '9999px',
                border:        '1px solid var(--gold)',
                color:         'var(--gold)',
                fontFamily:    "'DM Sans', sans-serif",
                fontSize:      '0.72rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                textDecoration:'none',
                transition:    'all 0.3s',
                display:       'inline-block',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = '#000' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gold)' }}
            >
              See All Work
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}
