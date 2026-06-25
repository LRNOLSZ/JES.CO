import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'

export default function CourseAccessPage() {
  const [email,     setEmail]     = useState('')
  const [state,     setState]     = useState('idle') // idle | loading | sent | error | not_found | rate_limited
  const [errorMsg,  setErrorMsg]  = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setState('loading')
    try {
      await axios.post('/api/courses/access/request/', { email: email.trim().toLowerCase() })
      setState('sent')
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail || ''
      if (status === 429) { setState('rate_limited'); return }
      if (status === 404) { setState('not_found');    return }
      setState('error')
      setErrorMsg(detail || 'Something went wrong. Please try again.')
    }
  }

  return (
    <>
      <JescoNavbar />
      <main style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem 4rem' }}>
        <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--champ)', marginBottom: '1rem' }}>
              Course Access
            </p>
            <h1 className="serif" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', lineHeight: 1.2, color: 'var(--bone)', margin: 0 }}>
              Access Your Courses
            </h1>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '0.9rem', fontWeight: 300, lineHeight: 1.8, color: 'var(--taupe)', marginTop: '0.75rem' }}>
              Enter the email address you used to purchase a course and we'll send you an access link.
            </p>
          </div>

          {/* Form or success */}
          {state === 'sent' ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem', background: 'color-mix(in srgb, var(--champ) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--champ) 30%, transparent)', borderRadius: '14px' }}>
              <div style={{ fontSize: '2rem' }}>✉️</div>
              <p className="serif" style={{ fontSize: '1.2rem', color: 'var(--bone)', margin: 0 }}>Check your inbox</p>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.87rem', fontWeight: 300, color: 'var(--taupe)', lineHeight: 1.7, margin: 0 }}>
                We've sent an access link to <strong style={{ color: 'var(--bone)' }}>{email}</strong>.
                Click it within 24 hours to open your course dashboard.
              </p>
              <button
                onClick={() => { setState('idle'); setEmail('') }}
                style={{ background: 'none', border: 'none', color: 'var(--champ)', fontFamily: 'var(--sans)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', marginTop: '0.5rem' }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setState('idle') }}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.9rem 1.2rem',
                  background: 'color-mix(in srgb, var(--bone) 5%, transparent)',
                  border: `1px solid ${state === 'not_found' || state === 'error' ? 'rgba(255,80,80,0.5)' : 'var(--hair)'}`,
                  borderRadius: '10px',
                  color: 'var(--bone)',
                  fontFamily: 'var(--sans)',
                  fontSize: '1rem',
                  outline: 'none',
                }}
              />

              {state === 'not_found' && (
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.82rem', color: 'rgba(255,120,120,0.9)', margin: 0 }}>
                  No courses found for this email. Check your spelling or{' '}
                  <Link to="/studio/courses" style={{ color: 'var(--champ)', textDecoration: 'none' }}>browse courses</Link>.
                </p>
              )}
              {state === 'rate_limited' && (
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.82rem', color: 'rgba(255,180,60,0.9)', margin: 0 }}>
                  Too many requests. Please wait 10 minutes before trying again.
                </p>
              )}
              {state === 'error' && (
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.82rem', color: 'rgba(255,120,120,0.9)', margin: 0 }}>
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={state === 'loading'}
                className="btn btn-gold"
                style={{ width: '100%', justifyContent: 'center', opacity: state === 'loading' ? 0.6 : 1 }}
              >
                {state === 'loading' ? 'Sending…' : 'Send Access Link'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', fontFamily: 'var(--sans)', fontSize: '0.78rem', color: 'var(--taupe-mut)' }}>
            Don't have a course yet?{' '}
            <Link to="/studio/courses" style={{ color: 'var(--champ)', textDecoration: 'none' }}>Browse all courses</Link>
          </p>
        </div>
      </main>
      <JescoFooter />
    </>
  )
}
