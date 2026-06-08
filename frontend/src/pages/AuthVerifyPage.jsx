import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyMagicLink } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function AuthVerifyPage() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const { login }      = useAuth()
  const [message, setMessage] = useState('Verifying your link…')
  const [error,   setError]   = useState(false)
  const hasVerified = useRef(false)  // survives StrictMode double-mount

  useEffect(() => {
    if (hasVerified.current) return  // block the StrictMode second run
    hasVerified.current = true

    const token = searchParams.get('token')
    if (!token) {
      setMessage('Invalid link — no token found.')
      setError(true)
      return
    }

    verifyMagicLink(token)
      .then(({ data }) => {
        login(data.token, data.user)
        navigate('/dashboard', { replace: true })
      })
      .catch(err => {
        const detail = err.response?.data?.detail || 'This link is invalid or has expired.'
        setMessage(detail)
        setError(true)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     'linear-gradient(135deg, #1a0d3d 0%, #0C0A14 60%)',
      padding:        '2rem',
    }}>
      <div style={{
        background:   'rgba(255,255,255,0.04)',
        border:       `1px solid ${error ? 'rgba(220,50,50,0.4)' : 'rgba(212,175,55,0.3)'}`,
        borderRadius: '16px',
        padding:      '3rem 2.5rem',
        textAlign:    'center',
        maxWidth:     '420px',
        width:        '100%',
        backdropFilter: 'blur(12px)',
      }}>
        {!error && (
          <div style={{
            width: '40px', height: '40px',
            border: '2px solid rgba(212,175,55,0.3)',
            borderTop: '2px solid #D4AF37',
            borderRadius: '50%',
            margin: '0 auto 1.5rem',
            animation: 'spin 0.8s linear infinite',
          }} />
        )}

        {error && (
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✦</div>
        )}

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize:   '1rem',
          color:      error ? 'rgba(255,120,120,0.9)' : 'rgba(255,255,255,0.85)',
          lineHeight: 1.6,
          marginBottom: error ? '1.5rem' : 0,
        }}>
          {message}
        </p>

        {error && (
          <a
            href="/studio/courses"
            style={{
              display:       'inline-block',
              padding:       '0.7rem 1.75rem',
              borderRadius:  '9999px',
              background:    'linear-gradient(135deg, #e8cc6b, #D4AF37)',
              color:         '#0C0A14',
              fontFamily:    "'DM Sans', sans-serif",
              fontSize:      '0.72rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight:    700,
              textDecoration:'none',
            }}
          >
            Back to Courses
          </a>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
