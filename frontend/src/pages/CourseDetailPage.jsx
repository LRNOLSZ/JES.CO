import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'

function LockIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: size, height: size }}>
      <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function LearnList({ text }) {
  if (!text) return null
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {lines.map((line, i) => (
        <li key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--champ)', marginTop: '0.15rem', flexShrink: 0 }}>✦</span>
          <span style={{ fontFamily: 'var(--sans)', fontSize: '0.9rem', fontWeight: 300, lineHeight: 1.7, color: 'var(--taupe)' }}>{line}</span>
        </li>
      ))}
    </ul>
  )
}

function PageShell({ children }) {
  return (
    <>
      <JescoNavbar />
      <main style={{ background: 'var(--ink)', minHeight: '100vh' }}>{children}</main>
      <JescoFooter />
    </>
  )
}

export default function CourseDetailPage() {
  const { slug } = useParams()
  const [course,   setCourse]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    axios.get(`/api/courses/${slug}/`)
      .then(r => setCourse(r.data))
      .catch(err => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <PageShell>
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid var(--hair)', borderTopColor: 'var(--champ)', animation: 'spin 0.8s linear infinite' }} />
      </div>
    </PageShell>
  )

  if (notFound) return (
    <PageShell>
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
        <p className="serif" style={{ fontSize: '1.5rem', color: 'var(--taupe)' }}>Course not found</p>
        <Link to="/studio/courses" style={{ color: 'var(--champ)', fontFamily: 'var(--sans)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none' }}>
          ← Back to Courses
        </Link>
      </div>
    </PageShell>
  )

  const tier = course?.tier || {}

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="wrap" style={{ paddingTop: '2rem' }}>
        <Link to="/studio/courses" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--sans)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--taupe-mut)', textDecoration: 'none', transition: 'color 0.3s' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--champ)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--taupe-mut)' }}
        >
          ← All Courses
        </Link>
      </div>

      {/* Content */}
      <div className="wrap" style={{ paddingTop: '3rem', paddingBottom: 'clamp(5rem,10vw,8rem)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(340px,100%),1fr))', gap: '3rem', alignItems: 'start' }}>

        {/* Left — course info */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {course.thumbnail_url && (
            <div style={{ borderRadius: '14px', overflow: 'hidden', aspectRatio: '16/9', border: '1px solid var(--hair)' }}>
              <img src={course.thumbnail_url} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {tier.name && (
              <span style={{ padding: '0.25rem 0.8rem', borderRadius: '9999px', background: 'color-mix(in srgb, var(--champ) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--champ) 50%, transparent)', color: 'var(--champ)', fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>
                {tier.name}
              </span>
            )}
            <span style={{ fontFamily: 'var(--sans)', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--champ)' }}>{course.category_display}</span>
            {course.duration_display && (
              <span style={{ fontFamily: 'var(--sans)', fontSize: '0.75rem', color: 'var(--taupe-mut)' }}>{course.duration_display}</span>
            )}
          </div>

          <h1 className="serif" style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', lineHeight: 1.15, color: 'var(--bone)', margin: 0 }}>
            {course.title}
          </h1>

          <p style={{ fontFamily: 'var(--sans)', fontSize: '1rem', fontWeight: 300, lineHeight: 1.8, color: 'var(--taupe)', margin: 0 }}>
            {course.description}
          </p>

          {course.what_youll_learn && (
            <div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--champ)', marginBottom: '1rem' }}>
                What You'll Learn
              </p>
              <LearnList text={course.what_youll_learn} />
            </div>
          )}
        </motion.div>

        {/* Right — videos */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Trailer */}
          <div style={{ background: 'color-mix(in srgb, var(--bone) 4%, transparent)', border: '1px solid var(--hair)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--hair)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.66rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--taupe)', margin: 0 }}>Free Preview</p>
              <span style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5fbf5f', background: 'rgba(95,191,95,0.1)', border: '1px solid rgba(95,191,95,0.28)', padding: '0.15rem 0.55rem', borderRadius: '9999px' }}>Unlocked</span>
            </div>
            {course.trailer_url
              ? <video src={course.trailer_url} controls style={{ width: '100%', display: 'block', background: '#000', maxHeight: '280px' }} />
              : <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--taupe-mut)', fontFamily: 'var(--sans)', fontSize: '0.8rem' }}>Trailer coming soon</div>
            }
          </div>

          {/* Full course — locked */}
          <div style={{ background: 'color-mix(in srgb, var(--bone) 3%, transparent)', border: '1px solid color-mix(in srgb, var(--champ) 30%, transparent)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid color-mix(in srgb, var(--champ) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.66rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--taupe)', margin: 0 }}>Full Course</p>
              <span style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--champ)', background: 'color-mix(in srgb, var(--champ) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--champ) 40%, transparent)', padding: '0.15rem 0.55rem', borderRadius: '9999px' }}>
                {tier.name || 'Premium'} Only
              </span>
            </div>

            <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--ink-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}>
              {course.thumbnail_url && (
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${course.thumbnail_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(8px)', opacity: 0.18 }} />
              )}
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'color-mix(in srgb, var(--champ) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--champ) 50%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--champ)' }}>
                  <LockIcon size={22} />
                </div>
                <p className="serif" style={{ fontSize: '1.1rem', color: 'var(--bone)', margin: 0 }}>{tier.name || 'Premium'} Tier Required</p>
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--taupe)', maxWidth: '260px', lineHeight: 1.6, margin: 0 }}>
                  Enroll in the {tier.name || 'Premium'} tier to unlock the full course video.
                </p>
                <button className="btn btn-gold" style={{ marginTop: '0.25rem' }}>
                  Enroll Now{tier.price_display && ` — ${tier.price_display}`}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </PageShell>
  )
}
