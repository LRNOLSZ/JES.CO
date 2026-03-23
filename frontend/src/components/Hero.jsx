import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const fade = (delay = 0) => ({
  initial:    { opacity: 0, y: 28 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.9, ease: 'easeOut', delay },
})

export default function Hero() {
  const [heroBg, setHeroBg] = useState(null)

  useEffect(() => {
    axios.get('/api/settings/').then(r => {
      if (r.data.hero_bg_url) setHeroBg(r.data.hero_bg_url)
    }).catch(() => {})
  }, [])

  return (
    <section style={{
      position:   'relative',
      width:      '100%',
      minHeight:  '100vh',
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow:   'hidden',
      background: 'var(--dark-base)',
    }}>

      {/* Background image (when uploaded from admin) */}
      {heroBg && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage:    `url(${heroBg})`,
          backgroundSize:     'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          opacity: 0.35,
          zIndex:  0,
        }} />
      )}

      {/* Gradient overlay — always present */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(12,10,20,0.55) 0%, rgba(12,10,20,0.2) 50%, rgba(12,10,20,0.75) 100%)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Soft purple glow — top centre */}
      <div style={{
        position:     'absolute',
        top:          '20%', left: '50%',
        transform:    'translateX(-50%)',
        width:        '480px', height: '480px',
        borderRadius: '50%',
        background:   'radial-gradient(circle, #60269E, transparent 70%)',
        opacity:      0.09,
        filter:       'blur(90px)',
        pointerEvents:'none',
        zIndex:       1,
      }} />

      {/* Soft gold glow — bottom right */}
      <div style={{
        position:     'absolute',
        bottom:       '15%', right: '15%',
        width:        '300px', height: '300px',
        borderRadius: '50%',
        background:   'radial-gradient(circle, #D4AF37, transparent 70%)',
        opacity:      0.06,
        filter:       'blur(80px)',
        pointerEvents:'none',
        zIndex:       1,
      }} />

      {/* Content */}
      <div style={{
        position:      'relative',
        zIndex:        2,
        textAlign:     'center',
        width:         '100%',
        maxWidth:      '820px',
        padding:       '0 1.5rem',
        marginLeft:    'auto',
        marginRight:   'auto',
      }}>

        {/* Eyebrow */}
        <motion.p {...fade(0.1)} style={{
          fontFamily:    "'DM Sans', sans-serif",
          fontSize:      '0.65rem',
          letterSpacing: '0.45em',
          textTransform: 'uppercase',
          color:         'var(--gold)',
          marginBottom:  '1.5rem',
        }}>
          Premium Skin &amp; Makeup Artistry
        </motion.p>

        {/* Headline */}
        <motion.h1 {...fade(0.25)} style={{
          fontFamily:   "'Playfair Display', serif",
          fontSize:     'clamp(2.8rem, 9vw, 5.5rem)',
          lineHeight:   1.05,
          marginBottom: '1.5rem',
          color:        'var(--text-primary)',
        }}>
          Where Beauty
          <br />
          <span style={{
            fontStyle:  'italic',
            background: 'linear-gradient(135deg, var(--gold-light), var(--gold), var(--gold-dark))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor:  'transparent',
            backgroundClip: 'text',
          }}>
            Becomes Art
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p {...fade(0.4)} style={{
          fontFamily:   "'DM Sans', sans-serif",
          fontSize:     '1rem',
          fontWeight:   300,
          lineHeight:   1.75,
          color:        'var(--text-secondary)',
          maxWidth:     '460px',
          margin:       '0 auto 2.5rem',
        }}>
          Transformative skin and makeup by Maame Ama — crafted for those who demand the finest.
        </motion.p>

        {/* CTAs */}
        <motion.div {...fade(0.55)} style={{
          display:        'flex',
          flexWrap:       'wrap',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            '1rem',
        }}>
          <a
            href="#gallery"
            style={{
              padding:       '0.9rem 2.25rem',
              borderRadius:  '9999px',
              background:    'linear-gradient(135deg, var(--gold-light), var(--gold))',
              color:         '#000',
              fontFamily:    "'DM Sans', sans-serif",
              fontSize:      '0.72rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight:    600,
              textDecoration:'none',
              transition:    'opacity 0.3s, transform 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'scale(1.03)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'scale(1)' }}
          >
            View Gallery
          </a>
          <a
            href="#booking"
            style={{
              padding:       '0.9rem 2.25rem',
              borderRadius:  '9999px',
              border:        '1px solid var(--glass-border)',
              color:         'var(--text-primary)',
              background:    'var(--glass-bg)',
              fontFamily:    "'DM Sans', sans-serif",
              fontSize:      '0.72rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              textDecoration:'none',
              transition:    'border-color 0.3s, transform 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.transform = 'scale(1.03)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            Book a Session
          </a>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        style={{
          position:  'absolute',
          bottom:    '2.5rem', left: '50%',
          transform: 'translateX(-50%)',
          display:   'flex', flexDirection: 'column',
          alignItems:'center', gap: '0.5rem',
          zIndex:    2,
        }}
      >
        <span style={{
          fontSize: '0.55rem', letterSpacing: '0.35em',
          textTransform: 'uppercase', color: 'var(--text-muted)',
        }}>
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          style={{
            width:      '1px',
            height:     '2.5rem',
            background: 'linear-gradient(to bottom, var(--gold), transparent)',
          }}
        />
      </motion.div>
    </section>
  )
}
