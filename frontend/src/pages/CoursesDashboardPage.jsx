import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCourseSession } from '../context/CourseSessionContext'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'
import TestimonialSubmitForm from '../components/TestimonialSubmitForm'

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''

export default function CoursesDashboardPage() {
  const { sessionEmail, purchases, isLoading, clearSession, refreshPurchases } = useCourseSession()
  const navigate = useNavigate()
  const [renewingSlug, setRenewingSlug] = useState(null) // slug of course currently mid-renewal
  const [storySlug, setStorySlug] = useState(null) // slug of course whose "Share Your Story" form is open
  const sessionKey = localStorage.getItem('jes_course_session')

  useEffect(() => {
    console.log('[Dashboard] guard effect: isLoading=', isLoading, 'sessionEmail=', sessionEmail)
    if (!isLoading && !sessionEmail) {
      console.warn('[Dashboard] redirecting to /studio/courses/access — isLoading is false and sessionEmail is falsy')
      navigate('/studio/courses/access')
    }
  }, [isLoading, sessionEmail, navigate])

  // Load Paystack script
  useEffect(() => {
    if (!PAYSTACK_KEY) return
    if (document.getElementById('paystack-js')) return
    const script = document.createElement('script')
    script.id    = 'paystack-js'
    script.src   = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  function handleSignOut() {
    clearSession()
    navigate('/studio/courses/access')
  }

  function handleRenew(course) {
    if (!PAYSTACK_KEY || !window.PaystackPop) return
    const handler = window.PaystackPop.setup({
      key:      PAYSTACK_KEY,
      email:    sessionEmail,
      amount:   Math.round((course.price || 0) * 100), // whole GHS → pesewas
      currency: 'GHS',
      metadata: { course_slug: course.slug },
      callback: async () => {
        setRenewingSlug(course.slug)
        // The webhook that actually extends access runs async on Paystack's side —
        // give it a moment, then check; retry once more if it hasn't landed yet.
        await new Promise(r => setTimeout(r, 2000))
        await refreshPurchases()
        await new Promise(r => setTimeout(r, 2000))
        await refreshPurchases()
        setRenewingSlug(null)
      },
      onClose: () => {},
    })
    handler.openIframe()
  }

  if (isLoading) return (
    <>
      <JescoNavbar />
      <main style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid var(--hair)', borderTopColor: 'var(--champ)', animation: 'spin 0.8s linear infinite' }} />
      </main>
      <JescoFooter />
    </>
  )

  return (
    <>
      <JescoNavbar />
      <main style={{ background: 'var(--ink)', minHeight: '100vh', paddingTop: '6rem', paddingBottom: 'clamp(4rem,8vw,6rem)' }}>
        <div className="wrap">

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '3rem' }}>
            <div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--champ)', marginBottom: '0.5rem' }}>
                My Courses
              </p>
              <h1 className="serif" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', lineHeight: 1.15, color: 'var(--bone)', margin: 0 }}>
                Your Collection
              </h1>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--taupe-mut)', marginTop: '0.4rem' }}>
                {sessionEmail}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              style={{ background: 'none', border: '1px solid var(--hair)', color: 'var(--taupe)', fontFamily: 'var(--sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '0.6rem 1.2rem', borderRadius: '9999px', cursor: 'pointer', transition: 'all 0.3s', marginTop: '0.4rem' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--champ)'; e.currentTarget.style.color = 'var(--champ)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--hair)'; e.currentTarget.style.color = 'var(--taupe)' }}
            >
              Sign out of this device
            </button>
          </div>

          {/* Course grid */}
          {purchases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              <p className="serif" style={{ fontSize: '1.4rem', color: 'var(--taupe)', margin: 0 }}>No courses yet</p>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.87rem', color: 'var(--taupe-mut)', margin: 0 }}>
                Browse available courses and unlock your first one.
              </p>
              <Link to="/studio/courses" className="btn btn-gold" style={{ marginTop: '0.5rem' }}>
                Browse Courses
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px,100%), 1fr))', gap: '1.75rem' }}>
              {purchases.map((course, i) => {
                const expired  = course.is_expired
                const warning  = !expired && course.days_remaining !== null && course.days_remaining <= 14
                const urgColor = expired ? 'rgba(220,80,80,0.9)' : 'rgba(220,160,30,0.9)'
                return (
                  <motion.div
                    key={course.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    style={{ background: 'color-mix(in srgb, var(--bone) 4%, transparent)', border: `1px solid ${expired ? 'rgba(220,80,80,0.25)' : 'var(--hair)'}`, borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', opacity: expired ? 0.75 : 1 }}
                  >
                    {course.thumbnail_url && (
                      <div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 10%', display: 'block', transition: 'transform 0.5s', filter: expired ? 'grayscale(60%)' : 'none' }}
                          onMouseEnter={e => { if (!expired) e.currentTarget.style.transform = 'scale(1.04)' }}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        />
                        {expired && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontFamily: 'var(--sans)', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(220,80,80,0.9)', border: '1px solid rgba(220,80,80,0.5)', padding: '0.3rem 0.8rem', borderRadius: '9999px' }}>Access Expired</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {course.tier?.name && (
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'color-mix(in srgb, var(--champ) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--champ) 40%, transparent)', color: 'var(--champ)', fontFamily: 'var(--sans)', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                            {course.tier.name}
                          </span>
                        )}
                        {course.duration_display && (
                          <span style={{ fontFamily: 'var(--sans)', fontSize: '0.68rem', color: 'var(--taupe-mut)' }}>{course.duration_display}</span>
                        )}
                      </div>
                      <h3 className="serif" style={{ fontSize: '1.1rem', lineHeight: 1.25, color: 'var(--bone)', margin: 0 }}>
                        {course.title}
                      </h3>

                      {/* Expiry countdown */}
                      {(expired || warning) && (
                        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.72rem', color: urgColor, margin: 0 }}>
                          {expired ? 'Your access has expired.' : `⚠ ${course.days_remaining} day${course.days_remaining === 1 ? '' : 's'} remaining — watch soon!`}
                        </p>
                      )}
                      {!expired && !warning && course.days_remaining !== null && (
                        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.68rem', color: 'var(--taupe-mut)', margin: 0 }}>
                          Access for {course.days_remaining} more day{course.days_remaining === 1 ? '' : 's'}
                        </p>
                      )}

                      <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
                        {expired ? (
                          <button
                            onClick={() => handleRenew(course)}
                            disabled={renewingSlug === course.slug}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0.65rem 1rem', borderRadius: '9999px', background: 'transparent', border: '1px solid rgba(220,80,80,0.4)', color: 'rgba(220,80,80,0.9)', fontFamily: 'var(--sans)', fontSize: '0.64rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: renewingSlug === course.slug ? 'default' : 'pointer', boxSizing: 'border-box', opacity: renewingSlug === course.slug ? 0.6 : 1 }}
                          >
                            {renewingSlug === course.slug ? 'Confirming…' : `Renew — GHS ${course.price} →`}
                          </button>
                        ) : (
                          <Link
                            to={`/studio/courses/${course.slug}`}
                            className="btn btn-gold"
                            style={{ width: '100%', justifyContent: 'center', fontSize: '0.64rem', padding: '0.65rem 1rem' }}
                          >
                            Watch Now →
                          </Link>
                        )}

                        {storySlug === course.slug ? (
                          <TestimonialSubmitForm
                            slug={course.slug}
                            sessionKey={sessionKey}
                            onDone={() => setStorySlug(null)}
                          />
                        ) : (
                          <button
                            onClick={() => setStorySlug(course.slug)}
                            style={{ width: '100%', marginTop: '0.6rem', background: 'none', border: '1px solid var(--hair)', color: 'var(--taupe-mut)', fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', padding: '0.6rem 1rem', borderRadius: '9999px', cursor: 'pointer', transition: 'all 0.3s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--champ)'; e.currentTarget.style.color = 'var(--champ)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--hair)'; e.currentTarget.style.color = 'var(--taupe-mut)' }}
                          >
                            Share Your Story
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

        </div>
      </main>
      <JescoFooter />
    </>
  )
}
