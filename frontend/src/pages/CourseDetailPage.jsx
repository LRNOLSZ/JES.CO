import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// Lock icon
function LockIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: size, height: size }}>
      <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

// Bullet point renderer — one per line
function LearnList({ text }) {
  if (!text) return null
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {lines.map((line, i) => (
        <li key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--gold)', marginTop: '0.15rem', flexShrink: 0 }}>✦</span>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize:   '0.9rem', fontWeight: 300,
            lineHeight: 1.7, color: 'var(--text-secondary)',
          }}>
            {line}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function CourseDetailPage() {
  const { slug } = useParams()
  const [course,  setCourse]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    axios.get(`/api/courses/${slug}/`)
      .then(r => setCourse(r.data))
      .catch(err => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }, [slug])

  const tier = course?.tier || {}
  const badgeColor = tier.badge_color || '#D4AF37'

  if (loading) return (
    <>
      <Navbar />
      <div style={{
        minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--dark-base)',
      }}>
        <div style={{
          width: '2rem', height: '2rem', borderRadius: '50%',
          border: '2px solid var(--glass-border)',
          borderTopColor: 'var(--gold)',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
      <Footer />
    </>
  )

  if (notFound) return (
    <>
      <Navbar />
      <div style={{
        minHeight: '80vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '1.5rem',
        background: 'var(--dark-base)',
      }}>
        <p style={{
          fontFamily: "'Playfair Display', serif", fontSize: '1.5rem',
          color: 'var(--text-secondary)',
        }}>
          Course not found
        </p>
        <Link to="/studio/courses" style={{
          color: 'var(--gold)', fontFamily: "'DM Sans', sans-serif",
          fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase',
          textDecoration: 'none',
        }}>
          ← Back to Courses
        </Link>
      </div>
      <Footer />
    </>
  )

  return (
    <>
      <Navbar />

      <main style={{ background: 'var(--dark-base)', minHeight: '100vh' }}>

        {/* ── Top bar ── */}
        <div style={{
          maxWidth: '72rem', margin: '0 auto',
          padding: '2rem 1.5rem 0',
        }}>
          <Link to="/studio/courses" style={{
            display:    'inline-flex', alignItems: 'center', gap: '0.4rem',
            fontFamily: "'DM Sans', sans-serif",
            fontSize:   '0.72rem', letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color:      'var(--text-muted)', textDecoration: 'none',
            transition: 'color 0.3s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            ← All Courses
          </Link>
        </div>

        {/* ── Main content ── */}
        <div style={{
          maxWidth: '72rem', margin: '0 auto',
          padding: '3rem 1.5rem 6rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))',
          gap: '3rem',
          alignItems: 'start',
        }}>

          {/* ── LEFT: Course info ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            {/* Thumbnail */}
            {course.thumbnail_url && (
              <div style={{ borderRadius: '1rem', overflow: 'hidden', aspectRatio: '16/9' }}>
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}

            {/* Tier + category */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                padding:       '0.25rem 0.8rem',
                borderRadius:  '9999px',
                background:    `${badgeColor}22`,
                border:        `1px solid ${badgeColor}88`,
                color:         badgeColor,
                fontFamily:    "'DM Sans', sans-serif",
                fontSize:      '0.62rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                fontWeight:    600,
              }}>
                {tier.name}
              </span>
              <span style={{
                fontFamily:    "'DM Sans', sans-serif",
                fontSize:      '0.62rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color:         'var(--gold)',
              }}>
                {course.category_display}
              </span>
              {course.duration_display && (
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize:   '0.75rem',
                  color:      'var(--text-muted)',
                }}>
                  {course.duration_display}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily:   "'Playfair Display', serif",
              fontSize:     'clamp(1.8rem, 4vw, 2.8rem)',
              lineHeight:   1.15,
              color:        'var(--text-primary)',
              margin:       0,
            }}>
              {course.title}
            </h1>

            {/* Description */}
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize:   '1rem',
              fontWeight: 300,
              lineHeight: 1.8,
              color:      'var(--text-secondary)',
              margin:     0,
            }}>
              {course.description}
            </p>

            {/* What you'll learn */}
            {course.what_youll_learn && (
              <div>
                <p style={{
                  fontFamily:    "'DM Sans', sans-serif",
                  fontSize:      '0.65rem',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color:         'var(--gold)',
                  marginBottom:  '1rem',
                }}>
                  What You'll Learn
                </p>
                <LearnList text={course.what_youll_learn} />
              </div>
            )}
          </motion.div>

          {/* ── RIGHT: Videos ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >

            {/* Trailer — always public */}
            <div style={{
              background:   'rgba(255,255,255,0.04)',
              border:       '1px solid var(--glass-border)',
              borderRadius: '1rem',
              overflow:     'hidden',
            }}>
              <div style={{
                padding:     '1rem 1.25rem',
                borderBottom:'1px solid var(--glass-border)',
                display:     'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <p style={{
                  fontFamily:    "'DM Sans', sans-serif",
                  fontSize:      '0.68rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color:         'var(--text-secondary)',
                  margin:        0,
                }}>
                  Free Preview
                </p>
                <span style={{
                  fontFamily:    "'DM Sans', sans-serif",
                  fontSize:      '0.6rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color:         '#4caf79',
                  background:    'rgba(76,175,121,0.12)',
                  border:        '1px solid rgba(76,175,121,0.3)',
                  padding:       '0.15rem 0.55rem',
                  borderRadius:  '9999px',
                }}>
                  Unlocked
                </span>
              </div>
              {course.trailer_url ? (
                <video
                  src={course.trailer_url}
                  controls
                  style={{ width: '100%', display: 'block', background: '#000', maxHeight: '280px' }}
                />
              ) : (
                <div style={{
                  padding: '2rem', textAlign: 'center',
                  color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.8rem',
                }}>
                  Trailer coming soon
                </div>
              )}
            </div>

            {/* Full course — locked */}
            <div style={{
              background:   'rgba(255,255,255,0.03)',
              border:       `1px solid ${badgeColor}44`,
              borderRadius: '1rem',
              overflow:     'hidden',
            }}>
              <div style={{
                padding:     '1rem 1.25rem',
                borderBottom:`1px solid ${badgeColor}33`,
                display:     'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <p style={{
                  fontFamily:    "'DM Sans', sans-serif",
                  fontSize:      '0.68rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color:         'var(--text-secondary)',
                  margin:        0,
                }}>
                  Full Course
                </p>
                <span style={{
                  fontFamily:    "'DM Sans', sans-serif",
                  fontSize:      '0.6rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color:         badgeColor,
                  background:    `${badgeColor}18`,
                  border:        `1px solid ${badgeColor}55`,
                  padding:       '0.15rem 0.55rem',
                  borderRadius:  '9999px',
                }}>
                  {tier.name} Only
                </span>
              </div>

              {/* Locked overlay */}
              <div style={{
                position:       'relative',
                aspectRatio:    '16/9',
                background:     'rgba(12,10,20,0.6)',
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '1rem',
                padding:        '2rem',
              }}>
                {/* Blurred thumbnail behind */}
                {course.thumbnail_url && (
                  <div style={{
                    position:   'absolute', inset: 0,
                    backgroundImage:   `url(${course.thumbnail_url})`,
                    backgroundSize:    'cover',
                    backgroundPosition:'center',
                    filter:    'blur(8px)',
                    opacity:   0.25,
                    zIndex:    0,
                  }} />
                )}

                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: `${badgeColor}22`,
                    border:     `1px solid ${badgeColor}66`,
                    display:    'flex', alignItems: 'center', justifyContent: 'center',
                    color:      badgeColor,
                  }}>
                    <LockIcon size={22} />
                  </div>

                  <p style={{
                    fontFamily:   "'Playfair Display', serif",
                    fontSize:     '1.1rem',
                    color:        'var(--text-primary)',
                    margin:       0,
                  }}>
                    {tier.name} Tier Required
                  </p>

                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize:   '0.82rem',
                    fontWeight: 300,
                    color:      'var(--text-muted)',
                    maxWidth:   '260px',
                    lineHeight: 1.6,
                    margin:     0,
                  }}>
                    Enroll in the {tier.name} tier to unlock the full course video.
                  </p>

                  <button style={{
                    marginTop:     '0.25rem',
                    padding:       '0.75rem 2rem',
                    borderRadius:  '9999px',
                    background:    `linear-gradient(135deg, ${badgeColor}cc, ${badgeColor})`,
                    border:        'none',
                    color:         '#000',
                    fontFamily:    "'DM Sans', sans-serif",
                    fontSize:      '0.72rem',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    fontWeight:    600,
                    cursor:        'pointer',
                    transition:    'opacity 0.3s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                  >
                    Enroll Now
                    {tier.price_display && ` — ${tier.price_display}`}
                  </button>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </main>

      <Footer />
    </>
  )
}
