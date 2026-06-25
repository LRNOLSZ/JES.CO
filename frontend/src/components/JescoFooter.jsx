import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const EXPLORE = [
  { label: 'Home',    to: '/' },
  { label: 'Shop',    to: '/products/makeup' },
  { label: 'Studio',  to: '/studio' },
  { label: 'Courses', to: '/studio/courses' },
]

function SocialIcon({ platform }) {
  const p = (platform || '').toLowerCase()
  const s = { width: 16, height: 16 }
  if (p === 'instagram' || p === 'ig') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
  if (p === 'tiktok' || p === 'tt') return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={s}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z" />
    </svg>
  )
  if (p === 'facebook') return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={s}>
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  )
  if (p === 'twitter' || p === 'x' || p === 'twitter/x') return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={s}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  )
}

export default function JescoFooter() {
  const [settings, setSettings] = useState({ tagline: '', email: '', phone: '', location: '' })
  const [socials,  setSocials]  = useState([])

  useEffect(() => {
    axios.get('/api/settings/').then(r => setSettings(r.data)).catch(() => {})
    axios.get('/api/socials/').then(r => setSocials(r.data)).catch(() => {})
  }, [])

  const contactItems = [
    settings.email    && { label: settings.email,    href: `mailto:${settings.email}` },
    settings.phone    && { label: settings.phone,    href: `tel:${settings.phone}` },
    settings.location && { label: settings.location, href: '#' },
  ].filter(Boolean)

  return (
    <footer style={{
      background:  'var(--ink)',
      borderTop:   '1px solid var(--hair)',
      paddingTop:  'clamp(4rem,8vw,6rem)',
    }}>

      {/* Top grid */}
      <div className="wrap footer-top" style={{
        display:             'grid',
        gridTemplateColumns: '1.4fr 1fr 1fr',
        gap:                 '3rem',
        paddingBottom:       '4rem',
      }}>

        {/* Column 1 — brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.7rem', marginBottom: '1.1rem' }}>
            <span style={{
              fontFamily:    'var(--serif)',
              fontSize:      '1.6rem',
              fontWeight:    800,
              letterSpacing: '0.1em',
              background:    'var(--metal)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
            }}>JES.CO</span>
            <span style={{
              fontFamily:    'var(--sans)',
              fontSize:      '0.52rem',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color:         'var(--taupe-mut)',
            }}>The Beauty Collective</span>
          </div>
          <p style={{
            fontFamily:  'var(--sans)',
            fontSize:    '0.92rem',
            fontWeight:  300,
            lineHeight:  1.8,
            color:       'var(--taupe)',
            maxWidth:    '22rem',
          }}>
            {settings.tagline || 'Where beauty meets craft. Luxury makeup, skincare, and studio artistry — curated for the woman who commands every room.'}
          </p>

          {/* Social icons */}
          {socials.length > 0 && (
            <div className="footer-socials" style={{ display: 'flex', gap: '0.7rem', marginTop: '1.8rem' }}>
              {socials.map(item => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.platform}
                  style={{
                    width:          '38px',
                    height:         '38px',
                    borderRadius:   '50%',
                    border:         '1px solid var(--hair)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    color:          'var(--taupe)',
                    transition:     'all 0.3s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--champ)'; e.currentTarget.style.color = 'var(--champ)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--hair)';  e.currentTarget.style.color = 'var(--taupe)' }}
                >
                  <SocialIcon platform={item.platform} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Column 2 — explore */}
        <div>
          <p style={{
            fontFamily:    'var(--sans)',
            fontSize:      '0.6rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color:         'var(--champ)',
            marginBottom:  '1.3rem',
          }}>
            Explore
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {EXPLORE.map(l => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  style={{
                    fontFamily:    'var(--sans)',
                    fontSize:      '0.88rem',
                    color:         'var(--taupe)',
                    textDecoration:'none',
                    transition:    'color 0.3s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--bone)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--taupe)')}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3 — contact */}
        <div>
          <p style={{
            fontFamily:    'var(--sans)',
            fontSize:      '0.6rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color:         'var(--champ)',
            marginBottom:  '1.3rem',
          }}>
            Contact
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {contactItems.length > 0
              ? contactItems.map(c => (
                <li key={c.label}>
                  <a
                    href={c.href}
                    style={{
                      fontFamily:    'var(--sans)',
                      fontSize:      '0.88rem',
                      color:         'var(--taupe)',
                      textDecoration:'none',
                      transition:    'color 0.3s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--bone)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--taupe)')}
                  >
                    {c.label}
                  </a>
                </li>
              ))
              : ['hello@jes.co', 'Accra, Ghana'].map(c => (
                <li key={c} style={{ fontFamily: 'var(--sans)', fontSize: '0.88rem', color: 'var(--taupe)' }}>{c}</li>
              ))
            }
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid var(--hair)' }}>
        <div className="wrap" style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          flexWrap:       'wrap',
          gap:            '0.6rem',
          padding:        '1.5rem 1.6rem 2.4rem',
        }}>
          <span style={{ fontFamily: 'var(--sans)', fontSize: '0.7rem', color: 'var(--taupe-mut)' }}>
            © {new Date().getFullYear()} JES.CO · All Rights Reserved
          </span>
          <span style={{ fontFamily: 'var(--sans)', fontSize: '0.7rem', color: 'var(--taupe-mut)' }}>
            Built by <a href="mailto:laryea024@gmail.com" style={{ color: 'var(--champ)', textDecoration: 'none' }}>Lemuel</a>
          </span>
        </div>
      </div>
    </footer>
  )
}
