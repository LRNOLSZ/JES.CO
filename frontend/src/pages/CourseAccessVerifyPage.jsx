import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'
import { useCourseSession } from '../context/CourseSessionContext'

export default function CourseAccessVerifyPage() {
  const navigate = useNavigate()
  const { refreshPurchases } = useCourseSession()
  const [state, setState] = useState('verifying') // verifying | success | error

  useEffect(() => {
    // If a session already exists, the token was already consumed — go straight to dashboard
    if (localStorage.getItem('jes_course_session')) {
      navigate('/studio/courses/dashboard', { replace: true })
      return
    }

    const params = new URLSearchParams(window.location.search)
    const token  = params.get('token')
    if (!token) { setState('error'); return }

    axios.get(`/api/courses/access/verify/?token=${token}`)
      .then(async r => {
        localStorage.setItem('jes_course_session', r.data.session_key)
        // The shared session context is a long-lived instance that only checks
        // localStorage reactively on its own mount — it has no way to know we just
        // wrote a new key here, so explicitly tell it to refetch before navigating,
        // otherwise the dashboard loads still thinking there's no active session.
        await refreshPurchases()
        setState('success')
        setTimeout(() => navigate('/studio/courses/dashboard', { replace: true }), 1200)
      })
      .catch(() => setState('error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately run once on
    // mount only; refreshPurchases' identity changes every time it's called (which we
    // do inside this very effect), so including it would cause a redundant re-run.
  }, [navigate])

  return (
    <>
      <JescoNavbar />
      <main style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem 4rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>

          {state === 'verifying' && (
            <>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', border: '2px solid var(--hair)', borderTopColor: 'var(--champ)', animation: 'spin 0.8s linear infinite' }} />
              <p className="serif" style={{ fontSize: '1.3rem', color: 'var(--bone)', margin: 0 }}>Verifying your link…</p>
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
                Access links are single-use and expire after 24 hours.
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
