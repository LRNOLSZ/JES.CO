import { useState } from 'react'
import { Reveal, SectionHead, ArrowIcon } from './Reveal'

const SERVICES = [
  { id: '01', name: 'Bridal Glam',            note: 'For the day everything is looked at.',           price: 'from GHS 280' },
  { id: '02', name: 'Editorial & Photoshoot', note: 'Camera-ready looks built for the lens.',         price: 'from GHS 220' },
  { id: '03', name: 'Corrective Skin',        note: 'Treatment-led prep for skin that glows back.',   price: 'from GHS 150' },
  { id: '04', name: 'Transformation Session', note: 'A full sit-down — face, mood, presence.',        price: 'from GHS 190' },
]

export default function ServicesSection() {
  const [hover, setHover] = useState(null)

  return (
    <section id="services" style={{ padding: 'clamp(5rem,11vw,9rem) 0' }}>
      <div className="wrap services-grid" style={{
        display:             'grid',
        gridTemplateColumns: '0.85fr 1.15fr',
        gap:                 'clamp(2.5rem,6vw,5rem)',
        alignItems:          'start',
      }}>

        {/* Left — sticky intro */}
        <div className="services-intro" style={{ position: 'sticky', top: '110px' }}>
          <SectionHead
            index="02"
            eyebrow="The Menu"
            title={<span>Services &amp; <span className="ital metal-text">rituals</span></span>}
            sub="Every service begins with a consultation. Prices are a starting point — the look is always yours."
          />
          <Reveal delay={0.18} style={{ marginTop: '2.2rem' }}>
            <a href="#booking" className="btn btn-gold">Reserve a Date</a>
          </Reveal>
        </div>

        {/* Right — service list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {SERVICES.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.08}>
              <a
                href="#booking"
                onMouseEnter={() => setHover(s.id)}
                onMouseLeave={() => setHover(null)}
                style={{
                  display:             'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  alignItems:          'center',
                  gap:                 '1.4rem',
                  padding:             `1.7rem ${hover === s.id ? '1.4rem' : '0.4rem'}`,
                  borderTop:           '1px solid var(--hair)',
                  borderBottom:        i === SERVICES.length - 1 ? '1px solid var(--hair)' : 'none',
                  textDecoration:      'none',
                  transition:          'padding 0.4s var(--ease), background 0.4s',
                  background:          hover === s.id
                    ? 'linear-gradient(90deg, color-mix(in srgb, var(--champ) 8%, transparent), transparent)'
                    : 'transparent',
                }}
              >
                <span className="index-num" style={{ fontSize: '0.95rem', minWidth: '2ch' }}>{s.id}</span>
                <span>
                  <span className="serif" style={{ display: 'block', fontSize: 'clamp(1.4rem,2.6vw,2rem)', fontWeight: 500, color: 'var(--bone)', lineHeight: 1.15 }}>{s.name}</span>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: '0.84rem', fontWeight: 300, color: 'var(--taupe)' }}>{s.note}</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: '0.82rem', color: 'var(--champ)', whiteSpace: 'nowrap' }}>{s.price}</span>
                  <span style={{
                    color:     'var(--champ)',
                    opacity:   hover === s.id ? 1 : 0,
                    transform: hover === s.id ? 'translateX(0)' : 'translateX(-6px)',
                    transition:'all 0.35s var(--ease)',
                  }}>
                    <ArrowIcon />
                  </span>
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
