import { useRef, useState } from 'react'
import { Reveal, SectionHead, ArrowIcon } from './Reveal'

const WORK = [
  { id: 'w1', title: 'Soft Bridal Glow',    category: 'Bridal' },
  { id: 'w2', title: 'Editorial Bronze',    category: 'Editorial' },
  { id: 'w3', title: 'Corrective Radiance', category: 'Skin' },
]

function BeforeAfterCard({ title, category }) {
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
        {/* AFTER layer */}
        <div className="ph" style={{
          position: 'absolute', inset: 0, borderRadius: 0, border: 'none',
          background: 'repeating-linear-gradient(135deg, rgba(168,134,74,0.13) 0px, rgba(168,134,74,0.13) 2px, transparent 2px, transparent 12px), linear-gradient(160deg, var(--ink-2), var(--ink))',
        }}>
          <span className="ph-tag" style={{ left: 'auto', right: 0, color: 'var(--champ)' }}>After</span>
        </div>

        {/* BEFORE layer — clipped left */}
        <div className="ph" style={{
          position: 'absolute', inset: 0, borderRadius: 0, border: 'none',
          width: pos + '%', overflow: 'hidden',
          background: 'repeating-linear-gradient(135deg, rgba(28,21,15,0.06) 0px, rgba(28,21,15,0.06) 2px, transparent 2px, transparent 12px), linear-gradient(160deg, var(--ink-3), var(--ink-2))',
        }}>
          <span className="ph-tag">Before</span>
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
      </div>

      <div>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--champ)' }}>{category}</p>
        <p className="serif ital" style={{ fontSize: '1.05rem', color: 'var(--bone)', marginTop: '0.25rem' }}>{title}</p>
      </div>
    </div>
  )
}

export default function WorkSection() {
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
          {WORK.map((w, i) => (
            <Reveal key={w.id} delay={i * 0.1}>
              <BeforeAfterCard title={w.title} category={w.category} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
