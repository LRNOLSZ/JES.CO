import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'

const navLinks = [
  { label: 'Products',      href: '#products', type: 'anchor' },
  { label: 'Glam Studio',   href: '/studio',   type: 'route'  },
  { label: 'About',         href: '#about',    type: 'anchor' },
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

export default function JescoNavbar() {
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
        background:          'linear-gradient(135deg, rgba(96,38,158,0.14) 0%, rgba(12,10,20,0.72) 60%, rgba(212,175,55,0.06) 100%)',
        backdropFilter:      'blur(32px) saturate(180%)',
        WebkitBackdropFilter:'blur(32px) saturate(180%)',
        borderBottom:        '1px solid rgba(212,175,55,0.18)',
        boxShadow:           '0 1px 0 rgba(212,175,55,0.08), 0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div style={{
        position:       'relative',
        maxWidth:       '1200px',
        margin:         '0 auto',
        padding:        '1rem 1.5rem',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
      }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            fontFamily:    "'Playfair Display', serif",
            fontSize:      '1.25rem',
            fontWeight:    700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            background:    'linear-gradient(135deg, var(--gold-light), var(--gold), var(--gold-dark))',
            WebkitBackgroundClip:'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip:'text',
          }}>
            JES.CO
          </div>
          <div style={{
            fontFamily:    "'DM Sans', sans-serif",
            fontSize:      '0.5rem',
            letterSpacing: '0.45em',
            textTransform: 'uppercase',
            color:         'var(--text-muted)',
            marginTop:     '2px',
          }}>
            Beauty Collective
          </div>
        </Link>

        {/* Desktop nav links */}
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

        {/* Right side: CTA + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>

          <Link
            to="/studio"
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
            Enter Glam Studio
          </Link>

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

      {/* Mobile dropdown */}
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
              background:          'linear-gradient(180deg, rgba(96,38,158,0.12) 0%, rgba(12,10,20,0.97) 100%)',
              backdropFilter:      'blur(32px) saturate(180%)',
              WebkitBackdropFilter:'blur(32px) saturate(180%)',
              borderTop:           '1px solid rgba(212,175,55,0.15)',
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
                <Link
                  to="/studio"
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
                  Enter Glam Studio
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
