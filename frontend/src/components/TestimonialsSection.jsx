import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { SectionHead } from './Reveal'
import { usePageImages } from '../hooks/usePageImages'

function StarRow({ count = 5 }) {
  return (
    <span style={{ display: 'flex', gap: '2px' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 16 16" width="12" height="12">
          <polygon
            points="8,1 10.2,5.4 15,6.1 11.5,9.5 12.4,14.3 8,12 3.6,14.3 4.5,9.5 1,6.1 5.8,5.4"
            fill={i < count ? 'var(--champ)' : 'var(--hair)'}
          />
        </svg>
      ))}
    </span>
  )
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([])
  const [idx,          setIdx]          = useState(0)
  const [animKey,      setAnimKey]      = useState(0)
  const images = usePageImages()
  const bgUrl  = images.studio_testimonials_bg_url || null

  useEffect(() => {
    axios.get('/api/testimonials/').then(r => setTestimonials(r.data)).catch(() => {})
  }, [])

  const go = useCallback((dir) => {
    setIdx(prev => (prev + dir + testimonials.length) % testimonials.length)
    setAnimKey(k => k + 1)
  }, [testimonials.length])

  if (!testimonials.length) return null

  const t = testimonials[idx]

  return (
    <section id="testimonials" style={{ padding: 'clamp(5rem,11vw,9rem) 0', background: 'var(--ink-2)', position: 'relative', overflow: 'hidden' }}>
      {bgUrl && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <img src={bgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.07 }} />
        </div>
      )}

      <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead
            index="04"
            eyebrow="Client Voices"
            title={<span>What they <span className="ital metal-text">say</span></span>}
            align="center"
          />
        </div>

        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div
            key={animKey}
            style={{
              padding:      'clamp(2rem,5vw,3.5rem)',
              background:   'color-mix(in srgb, var(--bone) 4%, transparent)',
              border:       '1px solid var(--hair)',
              borderRadius: '20px',
              textAlign:    'center',
              animation:    'fadeSlideUp 0.45s var(--ease) both',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.4rem' }}>
              <StarRow count={t.rating || 5} />
            </div>

            <div className="serif ital metal-text" style={{ fontSize: '4rem', lineHeight: 0.6, marginBottom: '1.1rem', opacity: 0.35 }}>&ldquo;</div>

            <blockquote className="serif ital" style={{ fontSize: 'clamp(1.15rem,2.2vw,1.55rem)', fontWeight: 400, lineHeight: 1.6, color: 'var(--bone)', margin: 0, marginBottom: '2rem' }}>
              {t.quote || t.body || t.text}
            </blockquote>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.9rem' }}>
              {t.avatar_url
                ? <img src={t.avatar_url} alt={t.client_name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid color-mix(in srgb, var(--champ) 40%, transparent)' }} />
                : <span style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--hair)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--champ)', fontSize: '1.1rem' }}>
                    {(t.client_name || 'C').charAt(0)}
                  </span>
              }
              <div style={{ textAlign: 'left' }}>
                <div className="serif" style={{ fontSize: '0.95rem', color: 'var(--bone)' }}>{t.client_name}</div>
                {t.service && <div style={{ fontFamily: 'var(--sans)', fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--taupe-mut)' }}>{t.service}</div>}
              </div>
            </div>
          </div>

          {testimonials.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.4rem', marginTop: '2rem' }}>
              <button
                onClick={() => go(-1)}
                aria-label="Previous"
                style={{ width: '44px', height: '44px', borderRadius: '50%', border: '1px solid var(--hair)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--taupe)' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--champ)'; e.currentTarget.style.color = 'var(--champ)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--hair)'; e.currentTarget.style.color = 'var(--taupe)' }}
              >
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>

              <div style={{ display: 'flex', gap: '0.45rem' }}>
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setIdx(i); setAnimKey(k => k + 1) }}
                    aria-label={`Testimonial ${i + 1}`}
                    style={{ width: i === idx ? '20px' : '6px', height: '6px', borderRadius: '9999px', border: 'none', cursor: 'pointer', background: i === idx ? 'var(--champ)' : 'var(--hair)', transition: 'width 0.35s var(--ease)', padding: 0 }}
                  />
                ))}
              </div>

              <button
                onClick={() => go(1)}
                aria-label="Next"
                style={{ width: '44px', height: '44px', borderRadius: '50%', border: '1px solid var(--hair)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--taupe)' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--champ)'; e.currentTarget.style.color = 'var(--champ)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--hair)'; e.currentTarget.style.color = 'var(--taupe)' }}
              >
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
