import { motion } from 'framer-motion'

export default function CoursesSection() {
  return (
    <section id="courses" style={{
      position:   'relative',
      width:      '100%',
      minHeight:  '100vh',
      display:    'flex',
      alignItems: 'center',
      overflow:   'hidden',
      background: 'var(--dark-surface)',
    }}>

      {/* Purple gradient wash */}
      <div style={{
        position:   'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(96,38,158,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Subtle top border accent */}
      <div style={{
        position:   'absolute', top: 0, left: '50%',
        transform:  'translateX(-50%)',
        width:      '40%', height: '1px',
        background: 'linear-gradient(to right, transparent, var(--purple-light), transparent)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      <div style={{
        position:  'relative',
        zIndex:    2,
        width:       '100%',
        maxWidth:    '72rem',
        marginLeft:  'auto',
        marginRight: 'auto',
        padding:     '6rem 1.5rem',
        textAlign:   'center',
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
            marginBottom:  '1.25rem',
          }}
        >
          Learn From The Best
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{
            fontFamily:   "'Playfair Display', serif",
            fontSize:     'clamp(2rem, 6vw, 3.5rem)',
            color:        'var(--text-primary)',
            marginBottom: '1.5rem',
          }}
        >
          Master Your Craft
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{
            fontFamily:   "'DM Sans', sans-serif",
            fontSize:     '1rem',
            fontWeight:   300,
            lineHeight:   1.8,
            color:        'var(--text-secondary)',
            maxWidth:     '480px',
            margin:       '0 auto 3rem',
          }}
        >
          Professional makeup and skincare courses — step-by-step video lessons
          taught by Maame Ama, available at your own pace.
        </motion.p>

        {/* Coming Soon badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            display:       'inline-block',
            padding:       '0.6rem 1.75rem',
            borderRadius:  '9999px',
            border:        '1px solid rgba(96,38,158,0.5)',
            background:    'rgba(96,38,158,0.12)',
            color:         'var(--purple-light)',
            fontFamily:    "'DM Sans', sans-serif",
            fontSize:      '0.7rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
          }}
        >
          Coming Soon
        </motion.div>
      </div>
    </section>
  )
}
