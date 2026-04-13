import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CourseCard from '../components/CourseCard'

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
