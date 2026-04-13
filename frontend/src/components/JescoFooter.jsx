import { useEffect, useState } from 'react'
import axios from 'axios'

const platformIcon = (platform) => {
  const p = platform.toLowerCase()
  const s = { width: 16, height: 16 }

  if (p === 'instagram') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
  if (p === 'facebook') return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={s}>
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  )
  if (p === 'tiktok') return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={s}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.77 1.52V6.76a4.85 4.85 0 01-1-.07z" />
    </svg>
  )
  if (p === 'twitter' || p === 'x' || p === 'twitter/x') return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={s}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
  if (p === 'youtube') return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={s}>
      <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  )
}

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
  </svg>
)
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
)
const LocationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

export default function JescoFooter() {
  const [settings, setSettings] = useState({ tagline: '', email: '', phone: '', location: '' })
  const [socials,  setSocials]  = useState([])

  useEffect(() => {
    axios.get('/api/settings/').then(r => setSettings(r.data)).catch(() => {})
    axios.get('/api/socials/').then(r => setSocials(r.data)).catch(() => {})
  }, [])

  const rowStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.5rem', textDecoration: 'none',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.85rem', color: 'var(--text-secondary)',
    transition: 'color 0.3s',
  }

  return (
    <footer style={{
      width:           '100%',
      background:      'var(--dark-base)',
      borderTop:       '1px solid var(--glass-border)',
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
    }}>

      {/* Top border accent */}
      <div style={{
        width:      '40%', height: '1px',
        background: 'linear-gradient(to right, transparent, var(--gold), transparent)',
        marginBottom: '-1px',
      }} />

      {/* Main content */}
      <div style={{
        width:         '100%',
        maxWidth:      '44rem',
        padding:       '4rem 1.5rem',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        textAlign:     'center',
        gap:           '2.5rem',
      }}>

        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontSize:   '1.5rem',
            background: 'linear-gradient(135deg, var(--gold-light), var(--gold), var(--gold-dark))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            JES.CO
          </p>
          {settings.tagline && (
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize:   '0.85rem', fontWeight: 300,
              color:      'var(--text-muted)', lineHeight: 1.7,
              maxWidth:   '22rem',
            }}>
              {settings.tagline}
            </p>
          )}
        </div>

        <div style={{ width: '3rem', height: '1px', background: 'var(--glass-border)' }} />

        {/* Contact */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.62rem', letterSpacing: '0.3em',
            textTransform: 'uppercase', color: 'var(--gold)',
          }}>
            Contact
          </p>
          {[
            { key: 'email',    value: settings.email,    href: `mailto:${settings.email}`,  Icon: EmailIcon },
            { key: 'phone',    value: settings.phone,    href: `tel:${settings.phone}`,      Icon: PhoneIcon },
            { key: 'location', value: settings.location, href: '#',                          Icon: LocationIcon },
          ].map(item => item.value && (
            <a key={item.key} href={item.href} style={rowStyle}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}><item.Icon /></span>
              <span>{item.value}</span>
            </a>
          ))}
        </div>

        <div style={{ width: '3rem', height: '1px', background: 'var(--glass-border)' }} />

        {/* Socials */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.62rem', letterSpacing: '0.3em',
            textTransform: 'uppercase', color: 'var(--gold)',
          }}>
            Follow Us
          </p>
          {socials.length === 0 ? (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Coming soon
            </p>
          ) : socials.map(item => (
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
              style={rowStyle}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              <span style={{ color: 'var(--text-muted)' }}>{platformIcon(item.platform)}</span>
              <span>{item.handle}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop:     '1px solid var(--glass-border)',
        width:         '100%',
        padding:       '1.5rem 1.5rem 2.5rem',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           '0.5rem',
        textAlign:     'center',
      }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize:   '0.68rem', color: 'var(--text-muted)',
        }}>
          &copy; {new Date().getFullYear()} JES.CO · All Rights Reserved
        </p>
        <a href="#" style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.68rem', color: 'var(--text-muted)',
          textDecoration: 'none', transition: 'color 0.3s',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          Built by <span style={{ color: 'var(--gold)' }}>Lemuel</span>
        </a>
      </div>
    </footer>
  )
}
