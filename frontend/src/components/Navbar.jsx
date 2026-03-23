import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'

const navLinks = [
  { label: 'Home',    href: '/',        type: 'route' },
  { label: 'Gallery', href: '/gallery', type: 'route' },
  { label: 'Courses', href: '#courses', type: 'anchor' },
  { label: 'Booking', href: '#booking', type: 'anchor' },
]

const linkBase = {
  fontFamily:    "'DM Sans', sans-serif",
  fontWeight:    500,
  fontSize:      '0.72rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  textDecoration:'none',
  color:         'var(--text-secondary)',
  transition:    'color 0.3s',
}

const hoverGold   = e => { e.currentTarget.style.color = 'var(--gold)' }
const unhoverLink = e => { e.currentTarget.style.color = 'var(--text-secondary)' }

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        position:            'fixed',
        top: 0, left: 0, right: 0,
        zIndex:              100,
        width:               '100%',
        background:          'rgba(12,10,20,0.38)',
        backdropFilter:      'blur(24px)',
        WebkitBackdropFilter:'blur(24px)',
        borderBottom:        '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Inner bar — flex, logo left, CTA right, links absolutely centred */}
      <div style={{
        position:       'relative',
        maxWidth:       '1200px',
        margin:         '0 auto',
        padding:        '1rem 1.5rem',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
      }}>

        {/* ── Logo (left) ── */}
        <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            fontFamily:    "'Playfair Display', serif",
            fontSize:      '1.15rem',
            fontWeight:    600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            background:    'linear-gradient(135deg, var(--gold-light), var(--gold), var(--gold-dark))',
            WebkitBackgroundClip:'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip:'text',
          }}>
            Jesres
          </div>
          <div style={{
            fontFamily:    "'DM Sans', sans-serif",
            fontSize:      '0.55rem',
            letterSpacing: '0.38em',
            textTransform: 'uppercase',
            color:         'var(--text-muted)',
            marginTop:     '2px',
          }}>
            Glam Studio
          </div>
        </Link>

        {/* ── Desktop nav links — absolutely centred, hidden on mobile via Tailwind ── */}
        {/*
          Key: NO display property in the inline style.
          Tailwind's `hidden` sets display:none on mobile.
          Tailwind's `md:flex` sets display:flex on desktop.
          Inline styles can't conflict because we don't set display here.
        */}
        <ul
          className="hidden md:flex"
          style={{
            position:       'absolute',
            left:           '50%',
            transform:      'translateX(-50%)',
            alignItems:     'center',
            gap:            '2rem',
            listStyle:      'none',
            margin:         0,
            padding:        0,
          }}
        >
          {navLinks.map(link => (
            <li key={link.label}>
              {link.type === 'route'
                ? <Link to={link.href} style={linkBase} onMouseEnter={hoverGold} onMouseLeave={unhoverLink}>{link.label}</Link>
                : <a    href={link.href} style={linkBase} onMouseEnter={hoverGold} onMouseLeave={unhoverLink}>{link.label}</a>
              }
            </li>
          ))}
        </ul>

        {/* ── Right side: CTA (desktop only) + hamburger (mobile only) ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>

          {/* Book Now — shown on desktop, hidden on mobile via Tailwind */}
          <a
            href="#booking"
            className="hidden md:inline-flex"
            style={{
              alignItems:    'center',
              padding:       '0.5rem 1.25rem',
              borderRadius:  '9999px',
              border:        '1px solid var(--gold)',
              color:         'var(--gold)',
              fontFamily:    "'DM Sans', sans-serif",
              fontSize:      '0.68rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              textDecoration:'none',
              transition:    'all 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = '#000' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gold)' }}
          >
            Book Now
          </a>

          {/* Hamburger — shown on mobile, hidden on desktop via Tailwind */}
          {/* NO display in inline style — Tailwind md:hidden controls it */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            className="md:hidden"
            style={{
              background:    'none',
              border:        'none',
              cursor:        'pointer',
              padding:       '0.4rem',
              flexDirection: 'column',
              gap:           '5px',
            }}
          >
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display:    'block',
                width:      '22px',
                height:     '1.5px',
                background: 'var(--gold)',
                transition: 'all 0.3s',
                transform:  menuOpen
                  ? i === 0 ? 'rotate(45deg) translateY(6.5px)'
                  : i === 2 ? 'rotate(-45deg) translateY(-6.5px)'
                  : 'scaleX(0)'
                  : 'none',
                opacity: menuOpen && i === 1 ? 0 : 1,
              }} />
            ))}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{   opacity: 0, height: 0 }}
            transition={{ duration: 0.28 }}
            style={{
              overflow:            'hidden',
              width:               '100%',
              background:          'rgba(12,10,20,0.96)',
              backdropFilter:      'blur(14px)',
              WebkitBackdropFilter:'blur(14px)',
              borderTop:           '1px solid var(--glass-border)',
            }}
          >
            <ul style={{
              listStyle:     'none',
              padding:       '1.75rem 1.5rem',
              display:       'flex',
              flexDirection: 'column',
              alignItems:    'center',
              gap:           '1.5rem',
            }}>
              {navLinks.map(link => (
                <li key={link.label}>
                  {link.type === 'route'
                    ? <Link to={link.href} onClick={() => setMenuOpen(false)} style={{ ...linkBase, fontSize: '0.85rem' }}>{link.label}</Link>
                    : <a    href={link.href} onClick={() => setMenuOpen(false)} style={{ ...linkBase, fontSize: '0.85rem' }}>{link.label}</a>
                  }
                </li>
              ))}
              <li>
                <a
                  href="#booking"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display:       'inline-block',
                    padding:       '0.65rem 1.75rem',
                    borderRadius:  '9999px',
                    border:        '1px solid var(--gold)',
                    color:         'var(--gold)',
                    fontFamily:    "'DM Sans', sans-serif",
                    fontSize:      '0.72rem',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    textDecoration:'none',
                    marginTop:     '0.5rem',
                  }}
                >
                  Book Now
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
