import { motion } from 'framer-motion'

const CALENDLY_URL = 'https://calendly.com/laryea024/30min'

export default function BookingSection() {
  const openCalendly = () => {
    if (window.Calendly) {
      window.Calendly.initPopupWidget({ url: CALENDLY_URL })
    }
  }

  return (
    <section id="booking" style={{
      width:      '100%',
      minHeight:  '100vh',
      background: 'var(--light-base)',
      display:    'flex',
      alignItems: 'center',
    }}>
      <div style={{
        width:         '100%',
        maxWidth:      '72rem',
        marginLeft:    'auto',
        marginRight:   'auto',
        padding:       '6rem 1.5rem',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        textAlign:     'center',
        gap:           '2rem',
      }}>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.65rem', letterSpacing: '0.45em', textTransform: 'uppercase', color: 'var(--purple)' }}
        >
          Book a Session
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 6vw, 3.5rem)', lineHeight: 1.1, color: 'var(--text-dark-primary)', maxWidth: '500px' }}
        >
          Reserve Your<br />
          <span style={{ fontStyle: 'italic' }}>Experience</span>
        </motion.h2>

        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ width: '3rem', height: '1px', background: 'linear-gradient(to right, var(--gold-light), var(--gold), var(--gold-dark))', transformOrigin: 'left' }}
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.25 }}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', fontWeight: 300, lineHeight: 1.8, color: 'var(--text-dark-secondary)', maxWidth: '440px' }}
        >
          Ready to transform? Reserve your session with Maame Ama directly —
          choose a date and time that works for you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.35 }}
        >
          <button
            onClick={openCalendly}
            style={{
              padding:       '1rem 2.5rem',
              borderRadius:  '9999px',
              background:    'linear-gradient(135deg, var(--gold-light), var(--gold))',
              color:         '#0C0A14',
              border:        'none',
              fontFamily:    "'DM Sans', sans-serif",
              fontSize:      '0.72rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight:    700,
              cursor:        'pointer',
              transition:    'opacity 0.3s, transform 0.3s',
              boxShadow:     '0 4px 24px rgba(212,175,55,0.25)',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Book a Session →
          </button>
        </motion.div>

      </div>
    </section>
  )
}
