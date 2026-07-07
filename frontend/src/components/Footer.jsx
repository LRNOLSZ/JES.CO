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
  if (p === 'linkedin') return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={s}>
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
  if (p === 'pinterest') return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={s}>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.852 0 1.266.64 1.266 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.476 1.806 1.771 0 3.135-1.866 3.135-4.56 0-2.385-1.714-4.052-4.16-4.052-2.833 0-4.494 2.124-4.494 4.319 0 .855.329 1.771.74 2.272a.3.3 0 01.069.284c-.075.314-.243.995-.276 1.134-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.938.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
    </svg>
  )
  if (p === 'whatsapp') return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={s}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741 1.024 1.053-3.636-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
  if (p === 'snapchat') return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={s}>
      <path d="M12.166 2C9.038 2 6.5 4.537 6.5 7.666v1.624a2.667 2.667 0 01-.398 1.41l-.59.948c-.183.294-.054.676.278.796.878.316 1.5 1.15 1.5 2.056 0 .19-.03.373-.085.545-.2.621-.77 1.055-1.37 1.055-.134 0-.269-.022-.399-.068-.293-.103-.61.095-.683.398-.48 2.014-2.383 2.57-2.753 2.57l-.297.065c-.294.08-.496.35-.496.654 0 .37.299.67.67.67.23 0 .493.07.764.193.784.356 1.607 1.026 2.9 1.026.46 0 .983-.083 1.585-.285C9.066 21.793 10.45 22 12 22s2.934-.207 3.494-.394c.602.202 1.126.285 1.585.285 1.293 0 2.116-.67 2.9-1.026.271-.123.534-.193.764-.193.371 0 .67-.3.67-.67 0-.304-.202-.574-.496-.654l-.297-.065c-.37 0-2.273-.556-2.753-2.57-.073-.303-.39-.501-.683-.398-.13.046-.265.068-.399.068-.6 0-1.17-.434-1.37-1.055a1.714 1.714 0 01-.085-.545c0-.906.622-1.74 1.5-2.056.332-.12.461-.502.278-.796l-.59-.948A2.667 2.667 0 0117.5 9.29V7.666C17.5 4.537 14.962 2 11.834 2h.332z" />
    </svg>
  )
  if (p === 'threads') return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={s}>
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.01v-.017c.03-3.579.834-6.43 2.388-8.47C5.728 1.205 8.48.024 12.06 0h.066c2.813.019 5.251.853 7.042 2.41 1.76 1.528 2.703 3.622 2.93 6.04l-2.017.162c-.186-1.998-.965-3.621-2.278-4.723-1.264-1.065-3.07-1.65-5.325-1.665h-.032c-2.646.019-4.744.879-6.236 2.556C4.749 6.176 3.975 8.572 3.944 11.97v.021c.031 3.39.806 5.78 2.29 7.356 1.49 1.584 3.587 2.423 6.229 2.44h.022c2.318-.016 4.144-.657 5.424-1.905 1.374-1.338 2.087-3.278 2.113-5.77l2.013.003c-.028 3.06-.939 5.487-2.71 7.21-1.627 1.583-3.876 2.46-6.826 2.48h-.313zm2.683-9.316c-.902-.074-1.606-.38-2.096-.912-.371-.405-.576-.924-.609-1.544a2.694 2.694 0 01.676-1.986c.5-.56 1.24-.876 2.11-.911.761-.03 1.41.155 1.928.552.49.378.804.934.913 1.604l1.99-.316c-.178-1.104-.7-2.017-1.512-2.636-.838-.64-1.917-.95-3.204-.9-1.39.054-2.56.536-3.386 1.46a4.7 4.7 0 00-1.178 3.467c.055 1.057.406 1.973 1.019 2.647.688.758 1.676 1.19 2.854 1.284l.495.04v1.994l-.008-.001c-1.83-.152-3.334-.896-4.348-2.15-.948-1.173-1.44-2.694-1.464-4.393l1.998-.027c.017 1.29.37 2.37 1.027 3.143.608.713 1.494 1.142 2.586 1.274v-1.79z" />
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

export default function Footer() {
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
            Jesres Glam Studio
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
          &copy; {new Date().getFullYear()} Jesres Glam Studio · All Rights Reserved
        </p>
        <a href="#" style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.68rem', color: 'var(--text-muted)',
          textDecoration: 'none', transition: 'color 0.3s',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          Built by <a href="mailto:laryea024@gmail.com" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Lemuel</a>
        </a>
      </div>
    </footer>
  )
}
