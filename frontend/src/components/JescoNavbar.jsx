import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import RegionSwitcher from './RegionSwitcher'

const LINKS = [
  { key: 'home',    label: 'Home',    to: '/' },
  { key: 'shop',    label: 'Shop',    to: null, scrollTo: 'lines' },
  { key: 'studio',  label: 'Studio',  to: '/studio' },
  { key: 'courses', label: 'Courses', to: '/studio/courses' },
]

export default function JescoNavbar({ overDark = false }) {
  const [open,  setOpen]  = useState(false)
  const [solid, setSolid] = useState(false)
  const { cartCount } = useCart()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close sheet on route change
  useEffect(() => { setOpen(false) }, [location])

  const light = overDark && !solid
  const linkColor    = light ? 'rgba(243,237,227,0.82)' : 'var(--taupe)'
  const subColor     = light ? 'rgba(243,237,227,0.55)' : 'var(--taupe-mut)'
  const burgerColor  = light ? 'rgba(243,237,227,0.82)' : 'var(--champ)'

  const activeKey = location.pathname === '/' ? 'home'
    : location.pathname.startsWith('/studio/courses') ? 'courses'
    : location.pathname.startsWith('/studio') ? 'studio'
    : ''

  function handleShopClick(e) {
    e.preventDefault()
    setOpen(false)
    if (location.pathname === '/') {
      document.getElementById('lines')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => {
        document.getElementById('lines')?.scrollIntoView({ behavior: 'smooth' })
      }, 120)
    }
  }

  return (
    <nav style={{
      position:         'fixed',
      top: 0, left: 0, right: 0,
      zIndex:           200,
      transition:       'background 0.4s var(--ease), border-color 0.4s, backdrop-filter 0.4s',
      background:       solid
        ? 'color-mix(in srgb, var(--ink) 85%, transparent)'
        : 'transparent',
      backdropFilter:   solid ? 'blur(20px) saturate(150%)' : 'none',
      WebkitBackdropFilter: solid ? 'blur(20px) saturate(150%)' : 'none',
      borderBottom:     `1px solid ${solid ? 'var(--hair)' : 'transparent'}`,
    }}>

      {/* Main bar */}
      <div className="wrap" style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        height:         '74px',
      }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.7rem', flexShrink: 0 }}>
          <span style={{
            fontFamily:    'var(--serif)',
            fontSize:      '1.3rem',
            fontWeight:    800,
            letterSpacing: '0.12em',
            background:    'var(--metal)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
          }}>
            JES.CO
          </span>
          <span style={{
            fontFamily:    'var(--sans)',
            fontSize:      '0.5rem',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color:         subColor,
            transition:    'color 0.4s',
          }}>
            The Beauty Collective
          </span>
        </Link>

        {/* Desktop nav links — centered */}
        <ul className="nav-links" style={{
          display:   'flex',
          gap:       '2.4rem',
          listStyle: 'none',
          position:  'absolute',
          left:      '50%',
          transform: 'translateX(-50%)',
        }}>
          {LINKS.map(l => {
            const isActive = l.key === activeKey
            const sharedStyle = {
              fontFamily:    'var(--sans)',
              fontSize:      '0.68rem',
              fontWeight:    500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color:         isActive ? 'var(--champ)' : linkColor,
              textDecoration:'none',
              transition:    'color 0.3s',
              paddingBottom: '4px',
              borderBottom:  isActive ? '1px solid var(--champ)' : '1px solid transparent',
              cursor:        'pointer',
              background:    'none',
              border:        'none',
              padding:       '0 0 4px 0',
              font:          'inherit',
            }
            return (
              <li key={l.key}>
                {l.scrollTo ? (
                  <button
                    onClick={handleShopClick}
                    style={sharedStyle}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--champ)')}
                    onMouseLeave={e => (e.currentTarget.style.color = isActive ? 'var(--champ)' : linkColor)}
                  >
                    {l.label}
                  </button>
                ) : (
                  <Link
                    to={l.to}
                    style={sharedStyle}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--champ)')}
                    onMouseLeave={e => (e.currentTarget.style.color = isActive ? 'var(--champ)' : linkColor)}
                  >
                    {l.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>

        {/* Right: region + cart + CTA + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>

          {/* Region / currency switcher — desktop only, mirrors nav-links visibility */}
          <div className="nav-links" style={{ display: 'flex' }}>
            <RegionSwitcher light={light} />
          </div>

          {/* Cart */}
          <Link
            to="/cart"
            style={{
              position:       'relative',
              display:        'inline-flex',
              alignItems:     'center',
              justifyContent: 'center',
              width:          '36px',
              height:         '36px',
              borderRadius:   '50%',
              border:         '1px solid var(--hair)',
              color:          light ? 'rgba(243,237,227,0.82)' : 'var(--taupe)',
              textDecoration: 'none',
              transition:     'all 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--champ)'; e.currentTarget.style.color = 'var(--champ)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--hair)'; e.currentTarget.style.color = light ? 'rgba(243,237,227,0.82)' : 'var(--taupe)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            {cartCount > 0 && (
              <span style={{
                position:       'absolute',
                top:            '-5px',
                right:          '-5px',
                background:     'var(--champ)',
                color:          '#1a130a',
                borderRadius:   '50%',
                width:          '15px',
                height:         '15px',
                fontSize:       '0.5rem',
                fontWeight:     700,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
              }}>
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

          {/* Book CTA — desktop */}
          <Link
            to="/studio#booking"
            className="nav-book"
            style={{
              display:       'inline-flex',
              alignItems:    'center',
              padding:       '0.6rem 1.4rem',
              borderRadius:  '9999px',
              background:    'var(--metal)',
              color:         '#1a130a',
              fontFamily:    'var(--sans)',
              fontSize:      '0.64rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight:    600,
              textDecoration:'none',
              boxShadow:     '0 4px 20px rgba(168,134,74,0.22)',
              transition:    'transform 0.3s, box-shadow 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(168,134,74,0.32)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 4px 20px rgba(168,134,74,0.22)' }}
          >
            Book a Session
          </Link>

          {/* Hamburger — mobile */}
          <button
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
            className="nav-burger"
            style={{
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              padding:    '0.4rem',
              display:    'none',
              flexDirection: 'column',
              gap:        '5px',
            }}
          >
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display:    'block',
                width:      '22px',
                height:     '1.5px',
                background: burgerColor,
                transition: 'all 0.3s',
                transform:  open
                  ? i === 0 ? 'rotate(45deg) translateY(6.5px)'
                  : i === 2 ? 'rotate(-45deg) translateY(-6.5px)'
                  : 'scaleX(0)'
                  : 'none',
                opacity: open && i === 1 ? 0 : 1,
              }} />
            ))}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <div style={{
        overflow:    'hidden',
        maxHeight:   open ? '320px' : '0',
        transition:  'max-height 0.4s var(--ease)',
        background:  'color-mix(in srgb, var(--ink) 96%, transparent)',
        borderTop:   open ? '1px solid var(--hair)' : 'none',
        backdropFilter: 'blur(20px)',
      }}>
        <ul style={{
          listStyle:     'none',
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           '1.3rem',
          padding:       '1.8rem',
        }}>
          {LINKS.map(l => {
            const isActive = l.key === activeKey
            const mobileStyle = {
              fontFamily:    'var(--sans)',
              fontSize:      '0.8rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color:         isActive ? 'var(--champ)' : 'var(--taupe)',
              textDecoration:'none',
              background:    'none',
              border:        'none',
              cursor:        'pointer',
              font:          'inherit',
              padding:       0,
            }
            return (
              <li key={l.key}>
                {l.scrollTo ? (
                  <button onClick={handleShopClick} style={mobileStyle}>
                    {l.label}
                  </button>
                ) : (
                  <Link to={l.to} style={mobileStyle}>
                    {l.label}
                  </Link>
                )}
              </li>
            )
          })}
          <li>
            <Link
              to="/studio#booking"
              className="btn btn-gold"
              style={{ padding: '0.6rem 1.4rem', fontSize: '0.64rem' }}
            >
              Book a Session
            </Link>
          </li>
          <li>
            <RegionSwitcher />
          </li>
        </ul>
      </div>
    </nav>
  )
}
