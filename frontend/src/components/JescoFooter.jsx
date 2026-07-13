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
        <div className="footer-brand">
          <div className="footer-brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.1rem' }}>
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
