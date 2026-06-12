import { Reveal, SectionHead, ArrowIcon } from './Reveal'
import { usePageImages } from '../hooks/usePageImages'

const CALENDLY_URL = 'https://calendly.com/laryea024/30min'

const STEPS = [
  { n: '01', label: 'Pick a date',         note: 'Choose a slot that works for you.' },
  { n: '02', label: 'Brief & confirm',      note: 'Tell us the look you have in mind.' },
  { n: '03', label: 'Show up & transform',  note: 'We handle the rest — you show up.' },
]

export default function BookingSection() {
  const images = usePageImages()
  const bookingUrl = images.studio_booking_url

  const openCalendly = () => {
    if (window.Calendly) {
      window.Calendly.initPopupWidget({ url: CALENDLY_URL })
    }
  }

  return (
    <section id="booking" style={{ padding: 'clamp(5rem,11vw,9rem) 0', background: 'var(--lite)', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle champ glow bottom right */}
      <div style={{ position: 'absolute', bottom: '-10%', right: '-6%', width: '540px', height: '540px', borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, var(--champ), transparent 68%)', opacity: 0.05, filter: 'blur(40px)' }} />

      <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'clamp(280px,42%,460px) 1fr',
          gap:                 'clamp(3rem,7vw,6rem)',
          alignItems:          'start',
        }}
          className="booking-grid"
        >
          {/* Left — booking atmosphere image */}
          <Reveal style={{ position: 'relative' }}>
            {bookingUrl
              ? <img src={bookingUrl} alt="Studio" style={{ width: '100%', aspectRatio: '3 / 4', borderRadius: '16px', objectFit: 'cover', display: 'block' }} />
              : <div className="ph" style={{ width: '100%', aspectRatio: '3 / 4', borderRadius: '16px', border: 'none', display: 'block' }}><span className="ph-tag">Booking / atmosphere image</span></div>
            }

            {/* Floating available badge */}
            <div style={{
              position:       'absolute',
              bottom:         '1.4rem',
              left:           '50%',
              transform:      'translateX(-50%)',
              display:        'flex',
              alignItems:     'center',
              gap:            '0.6rem',
              background:     'color-mix(in srgb, var(--bone) 88%, transparent)',
              backdropFilter: 'blur(10px)',
              border:         '1px solid color-mix(in srgb, var(--champ) 30%, transparent)',
              borderRadius:   '9999px',
              padding:        '0.55rem 1.2rem',
              whiteSpace:     'nowrap',
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#5fbf5f', boxShadow: '0 0 0 3px color-mix(in srgb, #5fbf5f 25%, transparent)' }} />
              <span style={{ fontFamily: 'var(--sans)', fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--lite-ink)' }}>Accepting Bookings</span>
            </div>
          </Reveal>

          {/* Right — content */}
          <div>
            <SectionHead
              index="05"
              eyebrow="Reserve a Session"
              title={<span>Begin your <span className="ital metal-text">transformation</span></span>}
              sub="Sessions book fast — select a date that suits you and we'll take it from there."
            />

            {/* Process steps */}
            <div style={{ marginTop: '2.8rem', display: 'flex', flexDirection: 'column', gap: '0' }}>
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 0.1}>
                  <div style={{
                    display:     'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap:         '1.2rem',
                    paddingTop:  '1.4rem',
                    paddingBottom:'1.4rem',
                    borderBottom: '1px solid color-mix(in srgb, var(--lite-2nd) 28%, transparent)',
                  }}>
                    <span style={{ fontFamily: 'var(--sans)', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--champ)', paddingTop: '0.2rem', minWidth: '2ch' }}>{s.n}</span>
                    <div>
                      <div className="serif" style={{ fontSize: '1.1rem', color: 'var(--lite-ink)', lineHeight: 1.2 }}>{s.label}</div>
                      <div style={{ fontFamily: 'var(--sans)', fontSize: '0.84rem', fontWeight: 300, color: 'var(--lite-2nd)', marginTop: '0.3rem' }}>{s.note}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.32} style={{ marginTop: '2.6rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={openCalendly} className="btn btn-gold">
                Book a Session <ArrowIcon />
              </button>
              <a href="https://wa.me/233000000000" target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ color: 'var(--lite-2nd)', borderColor: 'color-mix(in srgb, var(--lite-2nd) 35%, transparent)' }}>
                WhatsApp Us
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
