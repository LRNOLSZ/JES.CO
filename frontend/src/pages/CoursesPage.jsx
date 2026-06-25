import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import axios from 'axios'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'
import { Reveal, SectionHead, ArrowIcon } from '../components/Reveal'

const CATEGORIES = [
  { key: 'all',          label: 'All' },
  { key: 'foundation',   label: 'Foundation' },
  { key: 'eyes',         label: 'Eye Artistry' },
  { key: 'contour',      label: 'Contouring' },
  { key: 'bridal',       label: 'Bridal' },
  { key: 'full_glam',    label: 'Full Glam' },
  { key: 'editorial',    label: 'Editorial' },
  { key: 'lips',         label: 'Lip Artistry' },
  { key: 'color_theory', label: 'Color Theory' },
]

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 13, height: 13 }}>
      <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 12, height: 12 }}>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function TrailerModal({ course, onClose }) {
  if (!course) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(28,21,15,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
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

function CourseCard({ course, onTrailerClick }) {
  const [hovered, setHovered] = useState(false)
  const [imgError, setImgError] = useState(false)

  return (
    <Link
      to={`/studio/courses/${course.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:      'flex',
        flexDirection:'column',
        background:   'color-mix(in srgb, var(--bone) 4%, transparent)',
        border:       `1px solid ${hovered ? 'color-mix(in srgb, var(--champ) 45%, transparent)' : 'var(--hair)'}`,
        borderRadius: '16px',
        overflow:     'hidden',
        textDecoration:'none',
        transform:    hovered ? 'translateY(-5px)' : 'none',
        transition:   'transform 0.4s var(--ease), border-color 0.4s',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '16 / 10', overflow: 'hidden', background: 'var(--ink-2)' }}>
        {course.thumbnail_url && !imgError
          ? <img src={course.thumbnail_url} alt={course.title} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 10%' }} />
          : <div className="ph" style={{ position: 'absolute', inset: 0, borderRadius: 0, border: 'none' }}><span className="ph-tag">Preview</span></div>
        }
        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', padding: '0.22rem 0.7rem', borderRadius: '9999px', background: 'color-mix(in srgb, var(--champ) 16%, transparent)', border: '1px solid color-mix(in srgb, var(--champ) 55%, transparent)', color: 'var(--champ)', fontFamily: 'var(--sans)', fontSize: '0.56rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
          {course.tier?.name || 'Signature'}
        </div>
        <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--taupe)', fontFamily: 'var(--sans)', fontSize: '0.62rem' }}>
          <LockIcon /> <span>Full course locked</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '1.2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.56rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--champ)' }}>{course.category_display}</p>
        <h3 className="serif" style={{ fontSize: '1.1rem', color: 'var(--bone)', lineHeight: 1.3, margin: 0 }}>{course.title}</h3>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.82rem', fontWeight: 300, lineHeight: 1.7, color: 'var(--taupe)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
          {course.description}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.85rem', borderTop: '1px solid var(--hair)' }}>
          {course.duration_display && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--sans)', fontSize: '0.74rem', color: 'var(--taupe)' }}>
              <ClockIcon /> {course.duration_display}
            </span>
          )}
          {course.tier?.price_display && (
            <span style={{ fontFamily: 'var(--sans)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--champ)' }}>{course.tier.price_display}</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
          <button
            onClick={e => { e.preventDefault(); onTrailerClick && onTrailerClick(course) }}
            style={{ flex: 1, padding: '0.55rem 0', borderRadius: '9999px', border: '1px solid var(--hair)', background: 'transparent', color: 'var(--taupe)', fontFamily: 'var(--sans)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--champ)'; e.currentTarget.style.color = 'var(--champ)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--hair)'; e.currentTarget.style.color = 'var(--taupe)' }}
          >
            ▶ Trailer
          </button>
          <span style={{ flex: 1, padding: '0.55rem 0', borderRadius: '9999px', background: 'var(--metal)', color: 'var(--bone)', fontFamily: 'var(--sans)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            View
          </span>
        </div>
      </div>
    </Link>
  )
}

function AlreadyAStudentSection() {
  const [email,      setEmail]      = useState('')
  const [status,     setStatus]     = useState('idle')
  const [message,    setMessage]    = useState('')
  const hasSession = !!localStorage.getItem('jes_course_session')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      await axios.post('/api/courses/access/request/', { email: email.trim().toLowerCase() })
      setStatus('sent')
      setMessage('Check your email — your access link is on its way.')
    } catch (err) {
      const detail = err.response?.data?.detail || ''
      if (err.response?.status === 404) {
        setMessage('No courses found for this email. Check your spelling or browse courses below.')
      } else {
        setMessage(detail || 'Something went wrong. Please try again.')
      }
      setStatus('error')
    }
  }

  return (
    <section id="my-courses" style={{ padding: 'clamp(5rem,10vw,8rem) 0', background: 'var(--lite)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, var(--champ), transparent 65%)', opacity: 0.04, pointerEvents: 'none' }} />

      <div className="wrap" style={{ maxWidth: '480px', textAlign: 'center', position: 'relative' }}>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.5em', textTransform: 'uppercase', color: 'var(--champ)', marginBottom: '0.8rem' }}>Already a Student?</p>
        <h2 className="serif" style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: 'var(--lite-ink)', lineHeight: 1.2, marginBottom: '0.75rem' }}>
          Access Your Courses
        </h2>

        {hasSession ? (
          /* Active session — go straight to dashboard */
          <>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '0.9rem', fontWeight: 300, color: 'var(--lite-2nd)', lineHeight: 1.75, marginBottom: '2rem' }}>
              Welcome back — your courses are ready.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
              <Link to="/studio/courses/dashboard" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }}>
                My Courses →
              </Link>
              <button
                onClick={() => { setStatus('idle'); localStorage.removeItem('jes_course_session') ; window.location.reload() }}
                style={{ background: 'none', border: 'none', fontFamily: 'var(--sans)', fontSize: '0.72rem', color: 'var(--lite-2nd)', cursor: 'pointer', letterSpacing: '0.05em', textDecoration: 'underline' }}
              >
                Sign in with a different email
              </button>
            </div>
          </>
        ) : (
          /* No session — show magic link request form */
          <>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '0.9rem', fontWeight: 300, color: 'var(--lite-2nd)', lineHeight: 1.75, marginBottom: '2rem' }}>
              Enter your email and we'll send you an access link — no password needed.
            </p>
            {status === 'sent' ? (
              <div style={{ padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid color-mix(in srgb, var(--champ) 35%, transparent)', background: 'color-mix(in srgb, var(--champ) 6%, transparent)' }}>
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.88rem', color: 'var(--champ)', lineHeight: 1.6 }}>✦ {message}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.85rem 1.1rem', borderRadius: '8px', border: '1px solid color-mix(in srgb, var(--champ) 25%, transparent)', background: 'color-mix(in srgb, var(--lite-ink) 6%, transparent)', color: 'var(--lite-ink)', fontFamily: 'var(--sans)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--champ)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--champ) 15%, transparent)' }}
                  onBlur={e  => { e.target.style.borderColor = 'color-mix(in srgb, var(--champ) 25%, transparent)'; e.target.style.boxShadow = 'none' }}
                />
                {status === 'error' && (
                  <p style={{ fontFamily: 'var(--sans)', fontSize: '0.8rem', color: 'rgba(255,120,120,0.85)', margin: 0 }}>{message}</p>
                )}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="btn btn-gold"
                  style={{ opacity: status === 'loading' ? 0.7 : 1, cursor: status === 'loading' ? 'not-allowed' : 'pointer' }}
                >
                  {status === 'loading' ? 'Sending…' : 'Send Access Link →'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default function CoursesPage() {
  const [courses,       setCourses]       = useState([])
  const [pageSettings,  setPageSettings]  = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [activeFilter,  setActiveFilter]  = useState('all')
  const [trailerCourse, setTrailerCourse] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    Promise.all([
      axios.get('/api/courses/'),
      axios.get('/api/course-page-settings/'),
    ]).then(([cr, sr]) => {
      setCourses(cr.data)
      setPageSettings(sr.data)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = activeFilter === 'all' ? courses : courses.filter(c => c.category === activeFilter)
  const heroBg   = pageSettings?.hero_bg_url

  return (
    <>
      <JescoNavbar />

      {/* Page hero */}
      <section style={{ position: 'relative', minHeight: '44vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--ink)' }}>
        {heroBg && (
          <>
            <img src={heroBg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', opacity: 0.42 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, color-mix(in srgb, var(--ink) 40%, transparent), var(--ink))' }} />
          </>
        )}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, var(--plum), transparent 70%)', opacity: 'var(--glow-plum)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '7rem 1.5rem 4.5rem' }}>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--taupe-mut)', marginBottom: '1.25rem' }}>
            <Link to="/studio" style={{ color: 'var(--taupe-mut)', textDecoration: 'none' }}>Studio</Link>
            {' '}›{' '}Courses
          </p>
          <motion.h1
            className="serif"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ fontSize: 'clamp(2rem,6vw,3.5rem)', color: 'var(--bone)' }}
          >
            {pageSettings?.hero_heading || <>Master the Art of <span className="ital metal-text">Beauty</span></>}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            style={{ fontFamily: 'var(--sans)', fontSize: '1rem', fontWeight: 300, lineHeight: 1.8, color: 'var(--taupe)', maxWidth: '520px', margin: '1.2rem auto 0' }}
          >
            {pageSettings?.hero_subtext || 'Step-by-step video courses taught by Maame Ama — learn professional makeup at your own pace.'}
          </motion.p>
        </div>
      </section>

      {/* Course listing */}
      <section style={{ background: 'var(--ink)', padding: 'clamp(3rem,6vw,5rem) 0 clamp(5rem,10vw,8rem)' }}>
        <div className="wrap">

          {/* Category filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '3rem' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveFilter(cat.key)}
                style={{
                  padding:       '0.4rem 1.1rem',
                  borderRadius:  '9999px',
                  border:        `1px solid ${activeFilter === cat.key ? 'var(--champ)' : 'var(--hair)'}`,
                  background:    activeFilter === cat.key ? 'color-mix(in srgb, var(--champ) 10%, transparent)' : 'transparent',
                  color:         activeFilter === cat.key ? 'var(--champ)' : 'var(--taupe-mut)',
                  fontFamily:    'var(--sans)',
                  fontSize:      '0.65rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  cursor:        'pointer',
                  transition:    'all 0.25s',
                  outline:       'none',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid var(--hair)', borderTopColor: 'var(--champ)', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '4rem 0', fontFamily: 'var(--sans)', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--taupe-mut)' }}>
              No courses in this category yet
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px,100%),1fr))', gap: '1.75rem' }}>
              {filtered.map((course, i) => (
                <Reveal key={course.id} delay={(i % 3) * 0.08}>
                  <CourseCard course={course} onTrailerClick={setTrailerCourse} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <AlreadyAStudentSection />
      <JescoFooter />

      {trailerCourse && <TrailerModal course={trailerCourse} onClose={() => setTrailerCourse(null)} />}
    </>
  )
}
