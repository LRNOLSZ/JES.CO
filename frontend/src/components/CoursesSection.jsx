import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Reveal, SectionHead, ArrowIcon } from './Reveal'

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" width="13" height="13" fill="none">
      <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" width="12" height="12" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function TrailerModal({ course, onClose }) {
  if (!course) return null
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(28,21,15,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '720px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <p className="serif" style={{ fontSize: '1.1rem', color: 'var(--lite-ink)' }}>
            {course.title} — <span className="ital" style={{ color: 'var(--champ)' }}>Free Preview</span>
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--taupe-mut)', cursor: 'pointer', fontSize: '1.4rem' }}>✕</button>
        </div>
        <video src={course.trailer_url} controls autoPlay style={{ width: '100%', borderRadius: '0.75rem', background: '#000' }} />
      </div>
    </div>
  )
}

function CourseCard({ course, onTrailerClick, index }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Reveal delay={index * 0.1}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background:   'color-mix(in srgb, var(--bone) 4%, transparent)',
          border:       `1px solid ${hovered ? 'color-mix(in srgb, var(--champ) 45%, transparent)' : 'var(--hair)'}`,
          borderRadius: '16px',
          overflow:     'hidden',
          display:      'flex',
          flexDirection:'column',
          cursor:       'pointer',
          transform:    hovered ? 'translateY(-6px)' : 'none',
          transition:   'transform 0.4s var(--ease), border-color 0.4s',
        }}
      >
        {/* Thumbnail */}
        <div style={{ position: 'relative', aspectRatio: '16 / 10', borderBottom: '1px solid var(--hair)', overflow: 'hidden', background: 'var(--ink-2)' }}>
          {course.thumbnail_url
            ? <img src={course.thumbnail_url} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div className="ph" style={{ position: 'absolute', inset: 0, borderRadius: 0, border: 'none' }}><span className="ph-tag">Course Preview</span></div>
          }

          {/* Tier badge */}
          <div style={{
            position: 'absolute', top: '0.8rem', right: '0.8rem',
            padding: '0.22rem 0.7rem', borderRadius: '9999px',
            background: 'color-mix(in srgb, var(--champ) 16%, transparent)',
            border: '1px solid color-mix(in srgb, var(--champ) 55%, transparent)',
            color: 'var(--champ)', fontFamily: 'var(--sans)', fontSize: '0.56rem',
            letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600,
          }}>
            {course.tier || 'Signature'}
          </div>

          {/* Lock badge */}
          <div style={{ position: 'absolute', bottom: '0.8rem', left: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--taupe)', fontFamily: 'var(--sans)', fontSize: '0.62rem' }}>
            <LockIcon /> <span>Full course locked</span>
          </div>

          {/* Play on hover */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hovered ? 1 : 0, transition: 'opacity 0.4s' }}
            onClick={() => course.trailer_url && onTrailerClick(course)}>
            <span style={{
              width: '54px', height: '54px', borderRadius: '50%',
              border: '1px solid var(--champ)',
              background: 'color-mix(in srgb, var(--ink) 60%, transparent)',
              backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--champ)',
            }}>▶</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.3rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '0.56rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--champ)' }}>{course.category || 'Foundations'}</p>
          <h3 className="serif" style={{ fontSize: '1.25rem', color: 'var(--bone)', lineHeight: 1.25 }}>{course.title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.9rem', borderTop: '1px solid var(--hair)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--sans)', fontSize: '0.74rem', color: 'var(--taupe)' }}>
              <ClockIcon /> {course.duration || '—'}
            </span>
            <span style={{ fontFamily: 'var(--sans)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--champ)' }}>
              {course.price ? `GHS ${course.price}` : '—'}
            </span>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

export default function CoursesSection() {
  const [courses,       setCourses]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [trailerCourse, setTrailerCourse] = useState(null)

  useEffect(() => {
    axios.get('/api/courses/').then(r => setCourses(r.data.slice(0, 3))).finally(() => setLoading(false))
  }, [])

  return (
    <section id="courses" style={{ padding: 'clamp(5rem,11vw,9rem) 0', background: 'var(--ink-3)', overflow: 'hidden', position: 'relative' }}>
      {/* Plum glow */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 55% at 50% 30%, var(--plum), transparent 70%)', opacity: 'var(--glow-plum)' }} />

      <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead
            index="03"
            eyebrow="Learn From the Best"
            title={<span>Master your <span className="ital metal-text">craft</span></span>}
            sub="Professional makeup courses — step-by-step video lessons taught by Maame Ama, at your own pace."
            align="center"
          />
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid var(--hair)', borderTopColor: 'var(--champ)', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <span style={{ display: 'inline-block', padding: '0.6rem 1.75rem', borderRadius: '9999px', border: '1px solid color-mix(in srgb, var(--champ) 40%, transparent)', color: 'var(--champ)', fontFamily: 'var(--sans)', fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
              Coming Soon
            </span>
          </div>
        )}

        {!loading && courses.length > 0 && (
          <>
            <div className="courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.6rem' }}>
              {courses.map((c, i) => (
                <CourseCard key={c.id} course={c} index={i} onTrailerClick={setTrailerCourse} />
              ))}
            </div>
            <Reveal delay={0.2} style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
              <Link to="/studio/courses" className="btn btn-ghost">View All Courses <ArrowIcon /></Link>
            </Reveal>
          </>
        )}
      </div>

      {trailerCourse && <TrailerModal course={trailerCourse} onClose={() => setTrailerCourse(null)} />}
    </section>
  )
}
