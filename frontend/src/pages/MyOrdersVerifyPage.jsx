import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'
import SEO from '../components/SEO'
import { useShopSession, SHOP_SESSION_KEY } from '../context/ShopSessionContext'

export default function MyOrdersVerifyPage() {
  const navigate = useNavigate()
  const { refresh } = useShopSession()
  const [state, setState]             = useState('verifying') // verifying | ready | confirming | success | error
  const [email, setEmail]             = useState('')
  const [errorDetail, setErrorDetail] = useState('')
  const [token, setToken]             = useState('')

  useEffect(() => {
    // Already signed in — the token was consumed on a previous visit.
    if (localStorage.getItem(SHOP_SESSION_KEY)) {
      navigate('/my-orders', { replace: true })
      return
    }

    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (!t) { setState('error'); return }
    setToken(t)

    // Read-only check that deliberately does NOT consume the token. Email
    // clients (Gmail especially) auto-fetch links to scan them before a human
    // ever taps them; if this GET burned the token, that automatic scan would
    // break the real click with "already used".
    axios.get(`/api/shop/access/verify/?token=${encodeURIComponent(t)}`)
      .then(r => {
        setEmail(r.data.email)
        setState('ready')
      })
      .catch(err => {
        setErrorDetail(err.response?.data?.detail || '')
        setState('error')
      })
  }, [navigate])

  function handleConfirm() {
    setState('confirming')
    axios.post('/api/shop/access/verify/', { token })
      .then(async r => {
        localStorage.setItem(SHOP_SESSION_KEY, r.data.session_key)
        // The session context is a single long-lived instance that only reads
        // localStorage on its own mount — it can't know a key was just written
        // here, so tell it to refetch before navigating. Without this the
        // account page loads still believing nobody is signed in.
        await refresh()
        setState('success')
        setTimeout(() => navigate('/my-orders', { replace: true }), 1000)
      })
      .catch(err => {
        setErrorDetail(err.response?.data?.detail || '')
        setState('error')
      })
  }

  return (
    <>
      <SEO title="Signing You In — JES.CO" />
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
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(168,134,74,0.12)', border: '1px solid rgba(168,134,74,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--champ)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <p className="serif" style={{ fontSize: '1.3rem', color: 'var(--bone)', margin: 0 }}>Link verified</p>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.87rem', fontWeight: 300, color: 'var(--taupe)', lineHeight: 1.7, margin: 0 }}>
                Continue as <strong style={{ color: 'var(--bone)', fontWeight: 500 }}>{email}</strong>
              </p>
              <button onClick={handleConfirm} className="btn btn-gold" style={{ marginTop: '0.5rem' }}>
                View my orders &amp; downloads
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
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.87rem', color: 'var(--taupe)', margin: 0 }}>Opening your account…</p>
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
                {errorDetail || 'Account links are single-use and expire after 24 hours.'}
              </p>
              <Link to="/my-orders" className="btn btn-gold" style={{ marginTop: '0.5rem' }}>
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
