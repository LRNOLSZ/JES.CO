import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyMagicLink } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function AuthVerifyPage() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const { login }      = useAuth()
  const [message, setMessage] = useState('Verifying your link…')
  const [error,   setError]   = useState(false)
  const hasVerified = useRef(false)

  useEffect(() => {
    if (hasVerified.current) return
    hasVerified.current = true

    const token = searchParams.get('token')
    if (!token) {
      setMessage('Invalid link — no token found.')
      setError(true)
      return
    }

    verifyMagicLink(token)
      .then(({ data }) => {
        flushSync(() => login(data.token, data.user))
        navigate('/dashboard', { replace: true })
      })
      .catch(err => {
        setMessage(err.response?.data?.detail || 'This link is invalid or has expired.')
        setError(true)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)', padding: '2rem' }}>
      <div style={{
        background:     'color-mix(in srgb, var(--bone) 4%, transparent)',
        border:         `1px solid ${error ? 'rgba(220,80,80,0.35)' : 'color-mix(in srgb, var(--champ) 30%, transparent)'}`,
        borderRadius:   '16px',
        padding:        '3rem 2.5rem',
        textAlign:      'center',
        maxWidth:       '420px',
        width:          '100%',
        position:       'relative',
      }}>
        {/* Top accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: error ? 'rgba(220,80,80,0.5)' : 'var(--metal)', borderRadius: '16px 16px 0 0' }} />

        {!error && (
          <div style={{ width: '40px', height: '40px', border: '2px solid var(--hair)', borderTop: '2px solid var(--champ)', borderRadius: '50%', margin: '0 auto 1.5rem', animation: 'spin 0.8s linear infinite' }} />
        )}

        {error && (
          <div className="serif ital metal-text" style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.6 }}>✦</div>
        )}

        <p style={{ fontFamily: 'var(--sans)', fontSize: '1rem', color: error ? 'rgba(220,80,80,0.9)' : 'var(--taupe)', lineHeight: 1.6, marginBottom: error ? '1.5rem' : 0 }}>
          {message}
        </p>

        {error && (
          <a href="/studio/courses" className="btn btn-gold" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Back to Courses
          </a>
        )}
      </div>
    </div>
  )
}
