import { motion } from 'framer-motion'

export default function BookingSection() {
  return (
    <section id="booking" style={{
      width:      '100%',
      minHeight:  '100vh',
      background: 'var(--light-base)',
      display:    'flex',
      alignItems: 'center',
    }}>
      <div style={{
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
            color:         'var(--purple)',
          }}
        >
          Book a Session
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
            color:      'var(--text-dark-primary)',
            maxWidth:   '500px',
          }}
        >
          Reserve Your<br />
          <span style={{ fontStyle: 'italic' }}>Experience</span>
        </motion.h2>

        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            width:      '3rem', height: '1px',
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
            color:      'var(--text-dark-secondary)',
            maxWidth:   '440px',
          }}
        >
          Ready to transform? Reach out to schedule your session with Maame Ama.
          Every booking is personal — tailored to you.
        </motion.p>

        {/* Placeholder form card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.35 }}
          style={{
            marginTop:    '1rem',
            width:        '100%',
            maxWidth:     '420px',
            background:   '#fff',
            border:       '1px solid var(--light-surface)',
            borderRadius: '1rem',
            padding:      '2rem 1.75rem',
            display:      'flex',
            flexDirection:'column',
            gap:          '1rem',
            boxShadow:    '0 4px 32px rgba(26,20,32,0.06)',
          }}
        >
          {['Full Name', 'Email Address', 'Service (e.g. Bridal Makeup)'].map(placeholder => (
            <input
              key={placeholder}
              type="text"
              placeholder={placeholder}
              disabled
              style={{
                width:         '100%',
                padding:       '0.75rem 1rem',
                borderRadius:  '0.5rem',
                border:        '1px solid var(--light-surface)',
                background:    'var(--light-base)',
                color:         'var(--text-dark-secondary)',
                fontFamily:    "'DM Sans', sans-serif",
                fontSize:      '0.85rem',
                outline:       'none',
                cursor:        'not-allowed',
              }}
            />
          ))}

          <div style={{
            padding:     '0.6rem 1rem',
            borderRadius:'0.5rem',
            border:      '1px solid var(--light-surface)',
            background:  'var(--light-base)',
            color:       'var(--text-dark-muted)',
            fontFamily:  "'DM Sans', sans-serif",
            fontSize:    '0.75rem',
            letterSpacing: '0.1em',
            textAlign:   'center',
          }}>
            Full booking form — coming soon
          </div>

          <a
            href="mailto:hello@jesresstudio.com"
            style={{
              display:       'block',
              padding:       '0.9rem',
              borderRadius:  '0.5rem',
              background:    'linear-gradient(135deg, var(--gold-light), var(--gold))',
              color:         '#000',
              fontFamily:    "'DM Sans', sans-serif",
              fontSize:      '0.72rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight:    600,
              textDecoration:'none',
              textAlign:     'center',
              transition:    'opacity 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            Send an Enquiry
          </a>
        </motion.div>

      </div>
    </section>
  )
}
