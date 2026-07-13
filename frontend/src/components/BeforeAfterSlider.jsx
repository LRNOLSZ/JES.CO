import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Reveal, SectionHead, ArrowIcon } from './Reveal'

function BeforeAfterCard({ title, category, beforeImage, afterImage }) {
  const ref   = useRef(null)
  const [pos,  setPos]  = useState(52)
  const [drag, setDrag] = useState(false)

  const move = (clientX) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div
        ref={ref}
        onPointerDown={e  => { setDrag(true); move(e.clientX); e.currentTarget.setPointerCapture(e.pointerId) }}
        onPointerMove={e  => drag && move(e.clientX)}
        onPointerUp={()   => setDrag(false)}
        onPointerCancel={() => setDrag(false)}
        style={{
          position:    'relative',
          aspectRatio: '3 / 4',
          borderRadius:'14px',
          overflow:    'hidden',
          cursor:      'ew-resize',
          userSelect:  'none',
          touchAction: 'none',
          border:      '1px solid var(--hair)',
        }}
      >
        {/* AFTER image — full width, always behind */}
        <img
          src={afterImage}
          alt={`${title} — After`}
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
        />

        {/* BEFORE image — clipped to left portion */}
        <div style={{ position: 'absolute', inset: 0, width: pos + '%', overflow: 'hidden' }}>
          <img
            src={beforeImage}
            alt={`${title} — Before`}
            draggable={false}
            style={{ position: 'absolute', inset: 0, width: `${100 / (pos / 100)}%`, height: '100%', objectFit: 'cover', objectPosition: 'top center', maxWidth: 'none' }}
          />
        </div>

        {/* Divider */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: pos + '%', width: '1px', background: 'linear-gradient(transparent, var(--champ), transparent)', pointerEvents: 'none' }} />

        {/* Handle */}
        <div style={{
          position: 'absolute', top: '50%', left: pos + '%',
          transform: 'translate(-50%,-50%)',
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'color-mix(in srgb, var(--ink) 78%, transparent)',
          border: '1.5px solid var(--champ)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
            <path d="M7 5l-4 5 4 5" stroke="var(--champ)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13 5l4 5-4 5" stroke="var(--champ)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* B/A labels */}
        <span style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', fontFamily: 'var(--sans)', fontSize: '0.55rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--taupe)', background: 'color-mix(in srgb, var(--ink) 72%, transparent)', padding: '0.18rem 0.5rem', borderRadius: '4px' }}>Before</span>
        <span style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', fontFamily: 'var(--sans)', fontSize: '0.55rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--champ)', background: 'color-mix(in srgb, var(--ink) 72%, transparent)', padding: '0.18rem 0.5rem', borderRadius: '4px' }}>After</span>
      </div>

      <div>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--champ)' }}>{category}</p>
        <p className="serif ital" style={{ fontSize: '1.05rem', color: 'var(--bone)', marginTop: '0.25rem' }}>{title}</p>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ aspectRatio: '3 / 4', borderRadius: '14px', border: '1px solid var(--hair)', background: 'color-mix(in srgb, var(--bone) 4%, transparent)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ height: '0.55rem', width: '38%', background: 'color-mix(in srgb, var(--champ) 18%, transparent)', borderRadius: '4px' }} />
        <div style={{ height: '1rem', width: '62%', background: 'color-mix(in srgb, var(--bone) 8%, transparent)', borderRadius: '4px' }} />
      </div>
    </div>
  )
}

export default function WorkSection() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/gallery/')
      .then(r => setItems(r.data.slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const showSkeletons = loading || items.length === 0

  return (
    <section id="work" style={{ padding: 'clamp(5rem,11vw,9rem) 0', background: 'var(--ink-2)', borderTop: '1px solid var(--hair)' }}>
      <div className="wrap">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '3.5rem' }}>
          <SectionHead
            index="01"
            eyebrow="Transformations"
            title={<span>The <span className="ital metal-text">Work</span></span>}
            sub="Drag the handle to reveal each transformation."
          />
          <Reveal delay={0.1}>
            <a href="/studio/gallery" className="btn btn-ghost">See All Work <ArrowIcon /></a>
          </Reveal>
        </div>

        <div className="work-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.8rem' }}>
          {showSkeletons
            ? [0, 1, 2].map(i => <SkeletonCard key={i} />)
            : items.map((item, i) => (
                <Reveal key={item.id} delay={i * 0.1}>
                  <BeforeAfterCard
                    title={item.title}
                    category={item.category_display}
                    beforeImage={item.before_image}
                    afterImage={item.after_image}
                  />
                </Reveal>
              ))
          }
        </div>
      </div>
    </section>
  )
}
