import { motion } from 'framer-motion'
import { Reveal, ArrowIcon } from './Reveal'
import { usePageImages } from '../hooks/usePageImages'

export default function StudioHero() {
  const images = usePageImages()
  const portraitUrl = images.studio_portrait_url
  return (
    <section style={{
      minHeight:     '100vh',
      display:       'flex',
      alignItems:    'center',
      overflow:      'hidden',
      paddingTop:    '94px',
      paddingBottom: 'clamp(3rem,7vh,6rem)',
      position:      'relative',
    }}>

      {/* Ambient glows */}
      <div style={{ position: 'absolute', top: '8%', left: '-6%', width: '620px', height: '620px', borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, var(--plum), transparent 68%)', opacity: 'var(--glow-plum)', filter: 'blur(40px)' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-4%', width: '520px', height: '520px', borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, var(--champ), transparent 70%)', opacity: 'var(--glow-champ)', filter: 'blur(30px)' }} />

      {/* Left vertical EST marker */}
      <div className="hero-vmark" style={{ position: 'absolute', left: '1.6rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
        <span className="v-label">EST. 2023</span>
        <span style={{ width: '1px', height: '70px', background: 'linear-gradient(var(--champ), transparent)' }} />
      </div>

      <div className="wrap hero-grid" style={{
        display:             'grid',
        gridTemplateColumns: '1.08fr 0.92fr',
        gap:                 'clamp(2rem,5vw,4.5rem)',
        alignItems:          'center',
        position:            'relative',
        zIndex:              2,
      }}>

        {/* Text — slides in from right */}
        <div className="hero-text-anim">
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.05, ease: [0.22,1,0.36,1] }}
            style={{ marginBottom: '1.6rem' }}
          >
            Premium Skin &amp; Makeup Artistry
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.15, ease: [0.22,1,0.36,1] }}
            style={{ fontSize: 'clamp(3.1rem,8.4vw,6.6rem)', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 0.98 }}
          >
            Where Beauty<br />
            <span className="ital metal-text" style={{ fontWeight: 500 }}>Becomes&nbsp;Art</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.28, ease: [0.22,1,0.36,1] }}
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.8rem 0 1.6rem' }}
          >
            <span style={{ width: '54px', height: '1px', background: 'var(--metal)' }} />
            <span style={{ fontFamily: 'var(--sans)', fontSize: '0.66rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--taupe-mut)' }}>
              by Maame Ama
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.38, ease: [0.22,1,0.36,1] }}
            style={{ fontFamily: 'var(--sans)', fontSize: 'clamp(0.95rem,1.4vw,1.08rem)', fontWeight: 300, lineHeight: 1.85, color: 'var(--taupe)', maxWidth: '30rem', marginBottom: '2.4rem' }}
          >
            Transformative skin and makeup, crafted for those who demand the finest. Bridal, editorial, corrective &amp; training — all under one roof.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.48, ease: [0.22,1,0.36,1] }}
            style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap' }}
          >
            <a href="#work" className="btn btn-gold">View the Work</a>
            <a href="#booking" className="btn btn-ghost">Book a Session <ArrowIcon /></a>
          </motion.div>
        </div>

        {/* Portrait — slides in from left */}
        <div className="hero-portrait hero-img-anim" style={{ position: 'relative' }}>
          {/* Arch border frame */}
          <div style={{ position: 'absolute', inset: '-10px', border: '1px solid var(--hair)', borderRadius: '220px 220px 18px 18px', pointerEvents: 'none' }} />

          {/* Artist portrait — from admin, falls back to placeholder */}
          {portraitUrl
            ? <img src={portraitUrl} alt="Maame Ama" style={{ width: '100%', aspectRatio: '3 / 4.2', borderRadius: '200px 200px 18px 18px', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
            : <div className="ph" style={{ width: '100%', aspectRatio: '3 / 4.2', borderRadius: '200px 200px 18px 18px', display: 'block' }}><span className="ph-tag">Portrait — Maame Ama</span></div>
          }

          {/* Caption badge */}
          <div style={{
            position:       'absolute',
            bottom:         '1.1rem',
            left:           '50%',
            transform:      'translateX(-50%)',
            display:        'flex',
            alignItems:     'center',
            gap:            '0.6rem',
            background:     'color-mix(in srgb, var(--ink) 70%, transparent)',
            backdropFilter: 'blur(10px)',
            border:         '1px solid var(--hair)',
            borderRadius:   '9999px',
            padding:        '0.5rem 1.1rem',
            whiteSpace:     'nowrap',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--champ)' }} />
            <span className="serif ital" style={{ fontSize: '0.92rem', color: 'var(--bone)' }}>Maame Ama</span>
            <span style={{ fontFamily: 'var(--sans)', fontSize: '0.55rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--taupe-mut)' }}>Founder</span>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="hero-scroll" style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontFamily: 'var(--sans)', fontSize: '0.5rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--taupe-mut)' }}>Scroll</span>
        <motion.span
          animate={{ scaleY: [1, 0.6, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          style={{ display: 'block', width: '1px', height: '40px', background: 'linear-gradient(var(--champ), transparent)', transformOrigin: 'top' }}
        />
      </div>
    </section>
  )
}
