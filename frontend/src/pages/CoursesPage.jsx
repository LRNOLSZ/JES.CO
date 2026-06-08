import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CourseCard from '../components/CourseCard'
import { requestMagicLink } from '../api/auth'

function AlreadyAStudentSection() {
  const [email,   setEmail]   = useState('')
  const [status,  setStatus]  = useState('idle') // idle | loading | sent | error
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      await requestMagicLink(email.trim())
      setStatus('sent')
      setMessage('Check your email — your magic link is on its way.')
    } catch (err) {
      if (err.response?.status === 429) {
        setMessage('Too many requests. Please wait 10 minutes and try again.')
      } else {
        setMessage('Something went wrong. Please try again.')
      }
      setStatus('error')
    }
  }

  return (
    <section style={{
      padding:    'clamp(4rem, 10vw, 7rem) 1.5rem',
      background: 'linear-gradient(160deg, #1a0d3d 0%, #0C0A14 60%)',
      position:   'relative',
      overflow:   'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(96,38,158,0.18) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center', position: 'relative' }}
      >
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.6rem', letterSpacing: '0.55em',
          textTransform: 'uppercase', color: '#D4AF37', marginBottom: '1rem',
        }}>
          Already a Student?
        </p>

        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
          color: '#fff', lineHeight: 1.2, marginBottom: '0.75rem',
        }}>
          Access Your Courses
        </h2>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.88rem', fontWeight: 300,
          color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, marginBottom: '2rem',
        }}>
          Enter your email and we'll send you a magic link — no password needed.
        </p>

        {status === 'sent' ? (
          <div style={{
            padding: '1.25rem 1.5rem', borderRadius: '12px',
            border: '1px solid rgba(212,175,55,0.35)',
            background: 'rgba(212,175,55,0.06)',
          }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.88rem', color: '#D4AF37', lineHeight: 1.6,
            }}>
              ✦ {message}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '0.85rem 1.1rem',
                borderRadius: '8px',
                border: '1px solid rgba(212,175,55,0.25)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderColor = '#D4AF37'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.15)' }}
              onBlur={e =>  { e.target.style.borderColor = 'rgba(212,175,55,0.25)'; e.target.style.boxShadow = 'none' }}
            />

            {status === 'error' && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: 'rgba(255,120,120,0.85)', margin: 0 }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                padding: '0.85rem',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #e8cc6b, #D4AF37)',
                color: '#0C0A14',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.68rem', letterSpacing: '0.2em',
                textTransform: 'uppercase', fontWeight: 700,
                border: 'none', cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                opacity: status === 'loading' ? 0.7 : 1,
                transition: 'opacity 0.25s, transform 0.25s',
              }}
              onMouseEnter={e => { if (status !== 'loading') e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {status === 'loading' ? 'Sending…' : 'Send Magic Link →'}
            </button>
          </form>
        )}
      </motion.div>
    </section>
  )
}

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

// Inline trailer modal
function TrailerModal({ course, onClose }) {
  if (!course) return null
  return (
    <div
      onClick={onClose}
      style={{
        position:   'fixed', inset: 0,
        background: 'rgba(12,10,20,0.92)',
        zIndex:     1000,
        display:    'flex', alignItems: 'center', justifyContent: 'center',
        padding:    '1.5rem',
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '720px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <p style={{
            fontFamily:    "'Playfair Display', serif",
            fontSize:      '1.1rem',
            color:         'var(--text-primary)',
          }}>
            {course.title} — <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Free Preview</span>
          </p>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem',
            }}
          >
            ✕
          </button>
        </div>
        <video
          src={course.trailer_url}
          controls
          autoPlay
          style={{ width: '100%', borderRadius: '0.75rem', background: '#000' }}
        />
      </div>
    </div>
  )
}

export default function CoursesPage() {
  const [courses,      setCourses]      = useState([])
  const [pageSettings, setPageSettings] = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [trailerCourse, setTrailerCourse] = useState(null)

  useEffect(() => {
    Promise.all([
      axios.get('/api/courses/'),
      axios.get('/api/course-page-settings/'),
    ]).then(([coursesRes, settingsRes]) => {
      setCourses(coursesRes.data)
      setPageSettings(settingsRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = activeFilter === 'all'
    ? courses
    : courses.filter(c => c.category === activeFilter)

  const heroBg = pageSettings?.hero_bg_url

  return (
    <>
      <Navbar />

      {/* ── Mini Hero ── */}
      <section style={{
        position:   'relative',
        width:      '100%',
        minHeight:  '50vh',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow:   'hidden',
        background: 'var(--dark-base)',
      }}>
        {heroBg && (
          <>
            <div style={{
              position:             'absolute', inset: 0,
              backgroundImage:      `url(${heroBg})`,
              backgroundSize:       'cover',
              backgroundPosition:   'center 20%',
              backgroundAttachment: 'fixed',
              opacity:              0.4,
              zIndex:               0,
            }} />
            <div style={{
              position:   'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(12,10,20,0.4) 0%, rgba(12,10,20,0.6) 100%)',
              zIndex:     1,
            }} />
          </>
        )}

        {/* Purple glow */}
        <div style={{
          position:     'absolute', top: '30%', left: '50%',
          transform:    'translateX(-50%)',
          width:        '500px', height: '300px',
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(96,38,158,0.25), transparent 70%)',
          filter:       'blur(60px)',
          pointerEvents:'none',
          zIndex:       1,
        }} />

        <div style={{
          position:  'relative', zIndex: 2,
          textAlign: 'center', padding: '5rem 1.5rem 4rem',
        }}>
          {/* Breadcrumb */}
          <p style={{
            fontFamily:    "'DM Sans', sans-serif",
            fontSize:      '0.6rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color:         'var(--text-muted)',
            marginBottom:  '1.25rem',
          }}>
            <Link to="/studio" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Studio</Link>
            {' '}&rsaquo;{' '}Courses
          </p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{
              fontFamily:    "'DM Sans', sans-serif",
              fontSize:      '0.65rem',
              letterSpacing: '0.45em',
              textTransform: 'uppercase',
              color:         'var(--gold)',
              marginBottom:  '1rem',
            }}
          >
            Learn From The Best
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize:   'clamp(2rem, 6vw, 3.5rem)',
              color:      'var(--text-primary)',
              marginBottom: '1.25rem',
            }}
          >
            {pageSettings?.hero_heading || 'Master the Art of Beauty'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize:   '1rem',
              fontWeight: 300,
              lineHeight: 1.8,
              color:      'var(--text-secondary)',
              maxWidth:   '520px',
              margin:     '0 auto',
            }}
          >
            {pageSettings?.hero_subtext || 'Step-by-step video courses taught by Maame Ama — learn professional makeup at your own pace.'}
          </motion.p>
        </div>
      </section>

      {/* ── Course Listing ── */}
      <section style={{
        width:      '100%',
        background: 'var(--dark-base)',
        padding:    '4rem 1.5rem 6rem',
      }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>

          {/* Filter bar */}
          <div style={{
            display:        'flex',
            flexWrap:       'wrap',
            gap:            '0.5rem',
            justifyContent: 'center',
            marginBottom:   '3rem',
          }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveFilter(cat.key)}
                style={{
                  padding:       '0.45rem 1.1rem',
                  borderRadius:  '9999px',
                  border:        `1px solid ${activeFilter === cat.key ? 'var(--gold)' : 'var(--glass-border)'}`,
                  background:    activeFilter === cat.key ? 'rgba(212,175,55,0.12)' : 'transparent',
                  color:         activeFilter === cat.key ? 'var(--gold)' : 'var(--text-muted)',
                  fontFamily:    "'DM Sans', sans-serif",
                  fontSize:      '0.72rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor:        'pointer',
                  transition:    'all 0.25s',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
              <div style={{
                width: '2rem', height: '2rem', borderRadius: '50%',
                border: '2px solid var(--glass-border)',
                borderTopColor: 'var(--gold)',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          ) : filtered.length === 0 ? (
            <p style={{
              textAlign:   'center', padding: '4rem 0',
              fontFamily:  "'DM Sans', sans-serif",
              fontSize:    '0.8rem', letterSpacing: '0.2em',
              textTransform: 'uppercase', color: 'var(--text-muted)',
            }}>
              No courses in this category yet
            </p>
          ) : (
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
              gap:                 '1.75rem',
            }}>
              {filtered.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                >
                  <CourseCard
                    course={course}
                    onTrailerClick={setTrailerCourse}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Already a student? ── */}
      <AlreadyAStudentSection />

      <Footer />

      {/* Trailer modal */}
      {trailerCourse && (
        <TrailerModal
          course={trailerCourse}
          onClose={() => setTrailerCourse(null)}
        />
      )}
    </>
  )
}
