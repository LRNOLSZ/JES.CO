import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import axios from 'axios'
import CourseCard from './CourseCard'

// Trailer modal (inline, lightweight)
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
            fontFamily: "'Playfair Display', serif",
            fontSize:   '1.1rem', color: 'var(--text-primary)',
          }}>
            {course.title} — <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Free Preview</span>
          </p>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem' }}
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

export default function CoursesSection() {
  const [courses,      setCourses]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [trailerCourse, setTrailerCourse] = useState(null)

  useEffect(() => {
    axios.get('/api/courses/')
      .then(r => setCourses(r.data.slice(0, 3)))
      .finally(() => setLoading(false))
  }, [])

  const showFallback = !loading && courses.length === 0

  return (
    <section id="courses" style={{
      position:   'relative',
      width:      '100%',
      minHeight:  '100vh',
      display:    'flex',
      alignItems: 'center',
      overflow:   'hidden',
      background: 'var(--dark-surface)',
    }}>

      {/* Purple gradient wash */}
      <div style={{
        position:      'absolute', inset: 0,
        background:    'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(96,38,158,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex:        0,
      }} />

      {/* Top border accent */}
      <div style={{
        position:      'absolute', top: 0, left: '50%',
        transform:     'translateX(-50%)',
        width:         '40%', height: '1px',
        background:    'linear-gradient(to right, transparent, var(--purple-light), transparent)',
        pointerEvents: 'none',
        zIndex:        1,
      }} />

      <div style={{
        position:  'relative', zIndex: 2,
        width:     '100%', maxWidth: '72rem',
        marginLeft: 'auto', marginRight: 'auto',
        padding:   '6rem 1.5rem',
      }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: showFallback ? 0 : '3.5rem' }}
        >
          <p style={{
            fontFamily:    "'DM Sans', sans-serif",
            fontSize:      '0.65rem',
            letterSpacing: '0.45em',
            textTransform: 'uppercase',
            color:         'var(--gold)',
            marginBottom:  '1.25rem',
          }}>
            Learn From The Best
          </p>
          <h2 style={{
            fontFamily:   "'Playfair Display', serif",
            fontSize:     'clamp(2rem, 6vw, 3.5rem)',
            color:        'var(--text-primary)',
            marginBottom: '1.25rem',
          }}>
            Master Your Craft
          </h2>
          <p style={{
            fontFamily:  "'DM Sans', sans-serif",
            fontSize:    '1rem',
            fontWeight:  300,
            lineHeight:  1.8,
            color:       'var(--text-secondary)',
            maxWidth:    '480px',
            margin:      '0 auto',
          }}>
            Professional makeup courses — step-by-step video lessons taught by Maame Ama, available at your own pace.
          </p>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
            <div style={{
              width: '2rem', height: '2rem', borderRadius: '50%',
              border: '2px solid var(--glass-border)',
              borderTopColor: 'var(--gold)',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        )}

        {/* Fallback — no courses yet */}
        {showFallback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ textAlign: 'center', marginTop: '3rem' }}
          >
            <div style={{
              display:       'inline-block',
              padding:       '0.6rem 1.75rem',
              borderRadius:  '9999px',
              border:        '1px solid rgba(96,38,158,0.5)',
              background:    'rgba(96,38,158,0.12)',
              color:         'var(--purple-light)',
              fontFamily:    "'DM Sans', sans-serif",
              fontSize:      '0.7rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
            }}>
              Coming Soon
            </div>
          </motion.div>
        )}

        {/* Course cards */}
        {!loading && courses.length > 0 && (
          <>
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
              gap:                 '1.5rem',
            }}>
              {courses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                >
                  <CourseCard
                    course={course}
                    onTrailerClick={setTrailerCourse}
                  />
                </motion.div>
              ))}
            </div>

            {/* View all */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}
            >
              <Link
                to="/studio/courses"
                style={{
                  padding:       '0.85rem 2.25rem',
                  borderRadius:  '9999px',
                  border:        '1px solid var(--gold)',
                  color:         'var(--gold)',
                  fontFamily:    "'DM Sans', sans-serif",
                  fontSize:      '0.72rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  textDecoration:'none',
                  transition:    'all 0.3s',
                  display:       'inline-block',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = '#000' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gold)' }}
              >
                View All Courses
              </Link>
            </motion.div>
          </>
        )}
      </div>

      {trailerCourse && (
        <TrailerModal course={trailerCourse} onClose={() => setTrailerCourse(null)} />
      )}
    </section>
  )
}
