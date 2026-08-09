import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'
import { useCourseSession } from '../context/CourseSessionContext'
import SEO from '../components/SEO'

export default function CourseAccessVerifyPage() {
  const navigate = useNavigate()
  const { refreshPurchases } = useCourseSession()
  const [state, setState] = useState('verifying') // verifying | ready | confirming | success | error
  const [email, setEmail] = useState('')
  const [errorDetail, setErrorDetail] = useState('')
  const [token, setToken] = useState('')

  useEffect(() => {
    // If a session already exists, the token was already consumed — go straight to dashboard
    if (localStorage.getItem('jes_course_session')) {
      navigate('/studio/courses/dashboard', { replace: true })
      return
    }

    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (!t) { setState('error'); return }
    setToken(t)

    // Read-only check — deliberately does NOT consume the token. Email clients
    // (Gmail especially) auto-fetch links in emails to scan them for safety before
    // a human ever taps them; if this GET consumed the token, that automatic scan
    // would burn it and the real click would fail with "already used".
    axios.get(`/api/courses/access/verify/?token=${t}`)
      .then(r => {
        setEmail(r.data.email)
        setState('ready')
      })
      .catch(err => {
        console.error('Magic link verify failed:', err.response?.data)
        setErrorDetail(err.response?.data?.detail || '')
        setState('error')
      })
  }, [navigate])

  function handleConfirm() {
    setState('confirming')
    axios.post('/api/courses/access/verify/', { token })
      .then(async r => {
        console.log('[Verify] confirm OK, session_key received, email:', r.data.email)
        localStorage.setItem('jes_course_session', r.data.session_key)
        // The shared session context is a long-lived instance that only checks
        // localStorage reactively on its own mount — it has no way to know we just
        // wrote a new key here, so explicitly tell it to refetch before navigating,
        // otherwise the dashboard loads still thinking there's no active session.
        await refreshPurchases()
        console.log('[Verify] refreshPurchases resolved, navigating to dashboard now')
        setState('success')
        setTimeout(() => navigate('/studio/courses/dashboard', { replace: true }), 1200)
      })
      .catch(err => {
        console.error('Magic link confirm failed:', err.response?.data)
        setErrorDetail(err.response?.data?.detail || '')
        setState('error')
      })
  }

  return (
    <>
      <SEO title="Verifying Access — JES.CO" />
      <JescoNavbar />
      <main style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem 4rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>

          {state === 'verifying' && (
            <>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', border: '2px solid var(--hair)', borderTopColor: 'var(--champ)', animation: 'spin 0.8s linear infinite' }} />
              <p className="serif" style={{ fontSize: '1.3rem', color: 'var(--bone)', margin: 0 }}>Verifying your link…</p>
            </>
          )}

          {state === 'ready' && (
            <>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--champ)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4.5L6 21l1.5-7.5L2 9h7z" />
                </svg>
              </div>
              <p className="serif" style={{ fontSize: '1.3rem', color: 'var(--bone)', margin: 0 }}>Link verified</p>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.87rem', fontWeight: 300, color: 'var(--taupe)', lineHeight: 1.7, margin: 0 }}>
                Continue as <strong style={{ color: 'var(--bone)', fontWeight: 500 }}>{email}</strong>
              </p>
              <button onClick={handleConfirm} className="btn btn-gold" style={{ marginTop: '0.5rem' }}>
                Continue to dashboard
              </button>
            </>
          )}

          {state === 'confirming' && (
            <>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', border: '2px solid var(--hair)', borderTopColor: 'var(--champ)', animation: 'spin 0.8s linear infinite' }} />
              <p className="serif" style={{ fontSize: '1.3rem', color: 'var(--bone)', margin: 0 }}>Signing you in…</p>
            </>
          )}

          {state === 'success' && (
            <>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(95,191,95,0.12)', border: '1px solid rgba(95,191,95,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5fbf5f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="serif" style={{ fontSize: '1.3rem', color: 'var(--bone)', margin: 0 }}>You're in!</p>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.87rem', color: 'var(--taupe)', margin: 0 }}>Opening your course dashboard…</p>
            </>
          )}

          {state === 'error' && (
            <>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,120,120,0.9)" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <p className="serif" style={{ fontSize: '1.3rem', color: 'var(--bone)', margin: 0 }}>Link expired or already used</p>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.87rem', fontWeight: 300, color: 'var(--taupe)', lineHeight: 1.7, margin: 0 }}>
                {errorDetail || 'Access links are single-use and expire after 24 hours.'}
              </p>
              <Link to="/studio/courses/access" className="btn btn-gold" style={{ marginTop: '0.5rem' }}>
                Get a new link
              </Link>
            </>
          )}

        </div>
      </main>
      <JescoFooter />
    </>
  )
}
