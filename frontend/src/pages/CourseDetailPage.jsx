import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'
import VideoPlayer from '../components/VideoPlayer'

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''

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

function CommentsSection({ slug, sessionKey }) {
  const [comments, setComments] = useState([])
  const [body, setBody]         = useState('')
  const [state, setState]       = useState('idle') // idle | submitting | done | error

  async function handleSubmit(e) {
    e.preventDefault()
    if (!body.trim()) return
    setState('submitting')
    try {
      await axios.post(`/api/courses/${slug}/comments/`, { body }, {
        headers: { 'X-Course-Session': sessionKey },
      })
      setState('done')
      setBody('')
    } catch {
      setState('error')
    }
  }

  return (
    <div style={{ marginTop: '3rem', borderTop: '1px solid var(--hair)', paddingTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <p style={{ fontFamily: 'var(--sans)', fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--champ)', margin: 0 }}>
        Leave a Comment
      </p>

      {comments.map(c => (
        <div key={c.id} style={{ padding: '1rem 1.25rem', background: 'color-mix(in srgb, var(--bone) 4%, transparent)', border: '1px solid var(--hair)', borderRadius: '10px' }}>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '0.72rem', color: 'var(--taupe-mut)', margin: '0 0 0.4rem' }}>{c.email}</p>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '0.9rem', fontWeight: 300, color: 'var(--taupe)', lineHeight: 1.7, margin: 0 }}>{c.body}</p>
        </div>
      ))}

      {state === 'done' ? (
        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.87rem', color: '#5fbf5f', margin: 0 }}>
          ✓ Comment submitted for review. Thank you!
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <textarea
            value={body}
            onChange={e => { setBody(e.target.value); setState('idle') }}
            placeholder="Share your thoughts or feedback on this course…"
            rows={4}
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.9rem 1.1rem', background: 'color-mix(in srgb, var(--bone) 5%, transparent)', border: '1px solid var(--hair)', borderRadius: '10px', color: 'var(--bone)', fontFamily: 'var(--sans)', fontSize: '0.9rem', resize: 'vertical', outline: 'none' }}
          />
          {state === 'error' && (
            <p style={{ fontFamily: 'var(--sans)', fontSize: '0.8rem', color: 'rgba(255,120,120,0.9)', margin: 0 }}>
              Something went wrong. Try again.
            </p>
          )}
          <button
            type="submit"
            disabled={state === 'submitting'}
            className="btn btn-gold"
            style={{ alignSelf: 'flex-start', opacity: state === 'submitting' ? 0.6 : 1 }}
          >
            {state === 'submitting' ? 'Submitting…' : 'Submit Comment'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function CourseDetailPage() {
  const { slug } = useParams()
  const [course,       setCourse]       = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [notFound,     setNotFound]     = useState(false)
  const [streamBlocked, setStreamBlocked] = useState(false)
  const [unlockState, setUnlockState] = useState('idle') // idle | collecting-email | loading | success | error
  const [unlockEmail, setUnlockEmail] = useState('')
  const [unlockError, setUnlockError] = useState('')
  const [ownsAlready, setOwnsAlready] = useState(null) // null | { is_expired, days_remaining }
  const heartbeatRef = useRef(null)

  const sessionKey = localStorage.getItem('jes_course_session')

  useEffect(() => {
    const headers = sessionKey ? { 'X-Course-Session': sessionKey } : {}
    axios.get(`/api/courses/${slug}/`, { headers })
      .then(r => setCourse(r.data))
      .catch(err => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }, [slug, sessionKey])

  // Load Paystack script
  useEffect(() => {
    if (!PAYSTACK_KEY) return
    const existing = document.getElementById('paystack-js')
    if (existing) return
    const script = document.createElement('script')
    script.id    = 'paystack-js'
    script.src   = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  async function handleUnlockEmailSubmit(e) {
    e.preventDefault()
    if (!unlockEmail.trim()) return

    if (!ownsAlready) {
      try {
        const { data } = await axios.get(`/api/courses/${slug}/purchase-check/`, {
          params: { email: unlockEmail.trim().toLowerCase() },
        })
        if (data.already_purchased) {
          setOwnsAlready(data)
          return
        }
      } catch {
        // check failed — don't block checkout on it
      }
    }

    handlePaystack()
  }

  function handlePaystack() {
    if (!PAYSTACK_KEY || !window.PaystackPop) {
      setUnlockState('error')
      setUnlockError('Payment not available yet. Please try again later.')
      return
    }
    setUnlockState('loading')
    const handler = window.PaystackPop.setup({
      key:      PAYSTACK_KEY,
      email:    unlockEmail,
      amount:   Math.round((course?.price || 0) * 100), // whole GHS → pesewas
      currency: 'GHS',
      metadata: {
        course_slug: slug,
      },
      callback: () => {
        setUnlockState('success')
      },
      onClose: () => {
        setUnlockState('idle')
      },
    })
    handler.openIframe()
  }

  function startHeartbeat() {
    if (heartbeatRef.current) return
    heartbeatRef.current = setInterval(async () => {
      try {
        const r = await axios.post(`/api/courses/${slug}/heartbeat/`, {}, {
          headers: { 'X-Course-Session': sessionKey },
        })
        setStreamBlocked(!r.data.allowed)
      } catch {
        // network hiccup — don't block
      }
    }, 30000)
  }

  function stopHeartbeat() {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
  }

  useEffect(() => () => stopHeartbeat(), [])

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

  const tier       = course?.tier || {}
  const hasAccess  = course?.has_access === true
  const hasSession = !!sessionKey
  const price      = course?.price ? `GHS ${course.price}` : null

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="wrap" style={{ paddingTop: '6rem' }}>
        <Link to="/studio/courses" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--sans)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--taupe-mut)', textDecoration: 'none', transition: 'color 0.3s' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--champ)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--taupe-mut)' }}
        >
          ← All Courses
        </Link>
      </div>

      <div className="wrap" style={{ paddingTop: '3rem', paddingBottom: 'clamp(5rem,10vw,8rem)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(340px,100%),1fr))', gap: '3rem', alignItems: 'start' }}>

        {/* Left — course info */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {course.thumbnail_url && (
            <div style={{ borderRadius: '14px', overflow: 'hidden', aspectRatio: '16/9', border: '1px solid var(--hair)' }}>
              <img src={course.thumbnail_url} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 10%', display: 'block' }} />
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

          {/* Comments — only for purchasers */}
          {hasAccess && sessionKey && (
            <CommentsSection slug={slug} sessionKey={sessionKey} />
          )}
        </motion.div>

        {/* Right — videos */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Trailer — always free */}
          <div style={{ background: 'color-mix(in srgb, var(--bone) 4%, transparent)', border: '1px solid var(--hair)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--hair)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.66rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--taupe)', margin: 0 }}>Free Preview</p>
              <span style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5fbf5f', background: 'rgba(95,191,95,0.1)', border: '1px solid rgba(95,191,95,0.28)', padding: '0.15rem 0.55rem', borderRadius: '9999px' }}>Unlocked</span>
            </div>
            {course.trailer_url
              ? <VideoPlayer src={course.trailer_url} style={{ width: '100%', display: 'block', background: '#000', maxHeight: '280px' }} />
              : <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--taupe-mut)', fontFamily: 'var(--sans)', fontSize: '0.8rem' }}>Trailer coming soon</div>
            }
          </div>

          {/* Full course — gated */}
          <div style={{ background: 'color-mix(in srgb, var(--bone) 3%, transparent)', border: `1px solid ${hasAccess ? 'rgba(95,191,95,0.3)' : 'color-mix(in srgb, var(--champ) 30%, transparent)'}`, borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${hasAccess ? 'rgba(95,191,95,0.2)' : 'color-mix(in srgb, var(--champ) 20%, transparent)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.66rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--taupe)', margin: 0 }}>Full Course</p>
              {hasAccess
                ? <span style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5fbf5f', background: 'rgba(95,191,95,0.1)', border: '1px solid rgba(95,191,95,0.28)', padding: '0.15rem 0.55rem', borderRadius: '9999px' }}>Unlocked</span>
                : <span style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--champ)', background: 'color-mix(in srgb, var(--champ) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--champ) 40%, transparent)', padding: '0.15rem 0.55rem', borderRadius: '9999px' }}>
                    {tier.name || 'Premium'}
                  </span>
              }
            </div>

            {hasAccess ? (
              <>
                {streamBlocked ? (
                  <div style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LockIcon size={18} />
                    </div>
                    <p className="serif" style={{ fontSize: '1rem', color: 'var(--bone)', margin: 0 }}>Video paused</p>
                    <p style={{ fontFamily: 'var(--sans)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--taupe)', maxWidth: '260px', lineHeight: 1.6, margin: 0 }}>
                      This video is already playing on 2 other devices. Close it there first, then try again.
                    </p>
                  </div>
                ) : (
                  <VideoPlayer
                    src={course.course_video_url}
                    style={{ width: '100%', display: 'block', background: '#000' }}
                    onPlay={startHeartbeat}
                    onPause={stopHeartbeat}
                    onEnded={stopHeartbeat}
                  />
                )}
              </>
            ) : (
              <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--ink-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}>
                {course.thumbnail_url && (
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${course.thumbnail_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(8px)', opacity: 0.18 }} />
                )}
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'color-mix(in srgb, var(--champ) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--champ) 50%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--champ)' }}>
                    <LockIcon size={22} />
                  </div>
                  <p className="serif" style={{ fontSize: '1.1rem', color: 'var(--bone)', margin: 0 }}>
                    {hasSession ? 'Purchase to unlock this course' : 'One-time purchase — lifetime access'}
                  </p>
                  <p style={{ fontFamily: 'var(--sans)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--taupe)', maxWidth: '260px', lineHeight: 1.6, margin: 0 }}>
                    {hasSession
                      ? `Pay once and watch as many times as you like.`
                      : `No account needed — pay and receive your access link by email.`}
                  </p>
                  {/* Paystack unlock flow */}
                  {unlockState === 'success' ? (
                    <p style={{ fontFamily: 'var(--sans)', fontSize: '0.87rem', color: '#5fbf5f', margin: 0, maxWidth: '260px' }}>
                      ✓ Payment successful — check your email for your access link.
                    </p>
                  ) : unlockState === 'collecting-email' || unlockState === 'loading' ? (
                    <form onSubmit={handleUnlockEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%', maxWidth: '280px' }}>
                      <input
                        type="email"
                        value={unlockEmail}
                        onChange={e => { setUnlockEmail(e.target.value); setOwnsAlready(null) }}
                        placeholder="your@email.com"
                        required
                        autoFocus
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          padding: '0.75rem 1rem',
                          background: 'color-mix(in srgb, var(--bone) 5%, transparent)',
                          border: '1px solid var(--hair)',
                          borderRadius: '10px',
                          color: 'var(--bone)',
                          fontFamily: 'var(--sans)',
                          fontSize: '0.9rem',
                          outline: 'none',
                        }}
                      />
                      {ownsAlready && (
                        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.78rem', fontWeight: 300, color: 'var(--taupe)', lineHeight: 1.6, margin: 0, textAlign: 'left' }}>
                          {`You already have access to this course (${ownsAlready.days_remaining} day${ownsAlready.days_remaining === 1 ? '' : 's'} left). Paying again will renew it to a fresh 180 days, not charge you for a second copy.`}
                          {' '}
                          <Link to="/studio/courses/access" style={{ color: 'var(--champ)', textDecoration: 'none' }}>Log in instead →</Link>
                        </p>
                      )}
                      <button type="submit" className="btn btn-gold" disabled={unlockState === 'loading'} style={{ opacity: unlockState === 'loading' ? 0.6 : 1 }}>
                        {unlockState === 'loading' ? 'Processing…' : ownsAlready ? `Continue & Renew — ${price || ''}` : `Continue to Payment — ${price || ''}`}
                      </button>
                    </form>
                  ) : (
                    <button
                      className="btn btn-gold"
                      style={{ marginTop: '0.25rem' }}
                      onClick={() => { setUnlockState('collecting-email'); setUnlockError('') }}
                    >
                      {price ? `Unlock — ${price}` : 'Unlock Course'}
                    </button>
                  )}
                  {unlockState === 'error' && (
                    <p style={{ fontFamily: 'var(--sans)', fontSize: '0.8rem', color: 'rgba(255,120,120,0.9)', margin: 0, maxWidth: '260px' }}>
                      {unlockError || 'Something went wrong. Please try again.'}
                    </p>
                  )}
                  {!hasSession && unlockState !== 'success' && (
                    <Link to="/studio/courses/access" style={{ fontFamily: 'var(--sans)', fontSize: '0.72rem', color: 'var(--taupe-mut)', textDecoration: 'none', marginTop: '0.25rem', transition: 'color 0.3s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--champ)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--taupe-mut)')}
                    >
                      Already purchased? Access your courses →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Approved public comments */}
          {(course.approved_comments || []).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--champ)', margin: 0 }}>
                Student Reviews
              </p>
              {course.approved_comments.map(c => (
                <div key={c.id} style={{ padding: '1rem 1.25rem', background: 'color-mix(in srgb, var(--bone) 3%, transparent)', border: '1px solid var(--hair)', borderRadius: '10px' }}>
                  <p style={{ fontFamily: 'var(--sans)', fontSize: '0.7rem', color: 'var(--taupe-mut)', margin: '0 0 0.4rem' }}>{c.email}</p>
                  <p style={{ fontFamily: 'var(--sans)', fontSize: '0.88rem', fontWeight: 300, color: 'var(--taupe)', lineHeight: 1.7, margin: 0 }}>{c.body}</p>
                </div>
              ))}
            </div>
          )}

        </motion.div>
      </div>
    </PageShell>
  )
}
