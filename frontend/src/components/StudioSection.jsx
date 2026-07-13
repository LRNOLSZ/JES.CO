import { Reveal, SectionHead } from './Reveal'
import { usePageImages } from '../hooks/usePageImages'

const STATS = [
  { n: '200+', label: 'Transformations' },
  { n: '4.9★', label: 'Client Rating' },
  { n: '3+',   label: 'Years of Craft' },
]

export default function StudioSection() {
  const images = usePageImages()
  const aboutUrl = images.studio_about_url
  return (
    <section id="studio" style={{ padding: 'clamp(5rem,11vw,9rem) 0', overflow: 'hidden' }}>
      <div className="wrap studio-grid" style={{
        display:             'grid',
        gridTemplateColumns: '0.92fr 1.08fr',
        gap:                 'clamp(2.5rem,6vw,5rem)',
        alignItems:          'center',
      }}>

        {/* Left — about image */}
        <Reveal className="studio-img" style={{ position: 'relative' }}>
          {aboutUrl
            ? <img src={aboutUrl} alt="Studio" style={{ width: '100%', aspectRatio: '4 / 5', borderRadius: '14px', objectFit: 'cover', display: 'block' }} />
            : <div className="ph" style={{ width: '100%', aspectRatio: '4 / 5', borderRadius: '14px', display: 'block' }}><span className="ph-tag">Studio / artist-at-work image</span></div>
          }
          {/* Floating J badge */}
          <div style={{
            position:       'absolute',
            top:            '-18px',
            right:          '-18px',
            width:          '108px',
            height:         '108px',
            borderRadius:   '50%',
            border:         '1px solid var(--champ)',
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            background:     'color-mix(in srgb, var(--ink) 70%, transparent)',
            backdropFilter: 'blur(8px)',
            textAlign:      'center',
            gap:            '2px',
          }}>
            <span className="serif ital metal-text" style={{ fontSize: '1.5rem' }}>J</span>
            <span style={{ fontFamily: 'var(--sans)', fontSize: '0.46rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--taupe-mut)' }}>Jesres</span>
          </div>
        </Reveal>

        {/* Right — copy */}
        <div>
          <Reveal as="p" className="eyebrow" style={{ marginBottom: '1.2rem' }}>The Studio</Reveal>
          <Reveal delay={0.06}>
            <h2 style={{ fontSize: 'clamp(2.1rem,4.6vw,3.5rem)', fontWeight: 500 }}>
              Luxury in every <span className="ital metal-text">touch</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12} style={{ width: '52px', height: '1px', background: 'var(--metal)', margin: '1.6rem 0' }} />
          <Reveal as="p" delay={0.16} style={{ fontFamily: 'var(--sans)', fontSize: '1rem', fontWeight: 300, lineHeight: 1.9, color: 'var(--taupe)', maxWidth: '34rem', marginBottom: '1.3rem' }}>
            Every session with Maame Ama is an experience — meticulously crafted, deeply personal. From corrective skincare to editorial makeup, the work is always intentional, always refined.
          </Reveal>
          <Reveal as="p" delay={0.2} style={{ fontFamily: 'var(--sans)', fontSize: '1rem', fontWeight: 300, lineHeight: 1.9, color: 'var(--taupe)', maxWidth: '34rem', marginBottom: '2.6rem' }}>
            The artistry arm of JES.CO — serving clients who expect nothing less than extraordinary.
          </Reveal>

          {/* Stats */}
          <Reveal delay={0.26} style={{ display: 'flex', gap: 'clamp(1.5rem,4vw,3.2rem)', flexWrap: 'wrap', borderTop: '1px solid var(--hair)', paddingTop: '2rem' }}>
            {STATS.map(s => (
              <div key={s.label}>
                <div className="serif metal-text" style={{ fontSize: 'clamp(2rem,3.4vw,2.7rem)', fontWeight: 600, lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--taupe-mut)', marginTop: '0.5rem' }}>{s.label}</div>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
