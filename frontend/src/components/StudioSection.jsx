import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

export default function StudioSection() {
  const [studioBg, setStudioBg] = useState(null)

  useEffect(() => {
    axios.get('/api/settings/').then(r => {
      if (r.data.studio_bg_url) setStudioBg(r.data.studio_bg_url)
    }).catch(() => {})
  }, [])

  return (
    <section style={{
      position:   'relative',
      width:      '100%',
      minHeight:  '100vh',
      display:    'flex',
      alignItems: 'center',
      overflow:   'hidden',
      background: studioBg ? 'transparent' : 'var(--dark-base)',
    }}>

      {/* Fixed blurred background image (when uploaded) */}
      {studioBg && (
        <>
          <div style={{
            position:             'absolute', inset: 0,
            backgroundImage:      `url(${studioBg})`,
            backgroundSize:       'cover',
            backgroundPosition:   'center 20%',
            backgroundAttachment: 'fixed',
            zIndex:               0,
          }} />
          {/* Dark overlay — just enough to keep text readable */}
          <div style={{
            position:   'absolute', inset: 0,
            background: 'rgba(12, 10, 20, 0.45)',
            zIndex:     1,
          }} />
        </>
      )}

      {/* Content */}
      <div style={{
        position:  'relative',
        zIndex:    2,
        width:       '100%',
        maxWidth:    '72rem',
        marginLeft:  'auto',
        marginRight: 'auto',
        padding:     '6rem 1.5rem',
        display:     'flex',
        flexDirection: 'column',
        alignItems:  'center',
        textAlign:   'center',
        gap:         '2rem',
      }}>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{
            fontFamily:    "'DM Sans', sans-serif",
            fontSize:      '0.65rem',
            letterSpacing: '0.45em',
            textTransform: 'uppercase',
            color:         'var(--gold)',
          }}
        >
          The Studio
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize:   'clamp(2rem, 6vw, 3.5rem)',
            lineHeight: 1.1,
            color:      'var(--text-primary)',
            maxWidth:   '600px',
          }}
        >
          Luxury in Every<br />
          <span style={{ fontStyle: 'italic' }}>Touch</span>
        </motion.h2>

        {/* Gold rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            width:      '3rem',
            height:     '1px',
            background: 'linear-gradient(to right, var(--gold-light), var(--gold), var(--gold-dark))',
            transformOrigin: 'left',
          }}
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.25 }}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize:   '1rem',
            fontWeight: 300,
            lineHeight: 1.8,
            color:      'var(--text-secondary)',
            maxWidth:   '520px',
          }}
        >
          Every session with Maame Ama is an experience — meticulously crafted,
          deeply personal. From corrective skincare to editorial makeup,
          the work is always intentional, always refined.
        </motion.p>

      </div>
    </section>
  )
}
