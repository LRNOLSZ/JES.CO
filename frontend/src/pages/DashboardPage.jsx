import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

export default function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (!isAuthenticated) return <Navigate to="/studio/courses" replace />

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div style={{
      minHeight:   '100vh',
      background:  'linear-gradient(160deg, #1a0d3d 0%, #0C0A14 50%, #120F1E 100%)',
      padding:     '0 1.5rem',
      display:     'flex',
      flexDirection:'column',
      alignItems:  'center',
      justifyContent:'center',
    }}>
      {/* Background glow */}
      <div style={{
        position:     'fixed',
        top: '30%', left: '50%',
        transform:    'translate(-50%,-50%)',
        width: '600px', height: '600px',
        borderRadius: '50%',
        background:   'radial-gradient(circle, rgba(96,38,158,0.18) 0%, transparent 65%)',
        pointerEvents:'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{
          width:          '100%',
          maxWidth:       '520px',
          background:     'rgba(255,255,255,0.04)',
          border:         '1px solid rgba(212,175,55,0.25)',
          borderRadius:   '20px',
          padding:        '3rem 2.5rem',
          backdropFilter: 'blur(16px)',
          boxShadow:      '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
          position:       'relative',
        }}
      >
        {/* Gold top accent */}
        <div style={{
          position:   'absolute',
          top: 0, left: 0, right: 0,
          height:     '2px',
          background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
          borderRadius:'20px 20px 0 0',
        }} />

        <p style={{
          fontFamily:    "'DM Sans', sans-serif",
          fontSize:      '0.6rem',
          letterSpacing: '0.55em',
          textTransform: 'uppercase',
          color:         '#D4AF37',
          marginBottom:  '1.25rem',
        }}>
          Student Portal
        </p>

        <h1 style={{
          fontFamily:   "'Playfair Display', serif",
          fontSize:     'clamp(1.6rem, 4vw, 2.2rem)',
          color:        '#fff',
          lineHeight:   1.15,
          marginBottom: '0.5rem',
        }}>
          Welcome back{user?.first_name ? `, ${user.first_name}` : ''}.
        </h1>

        <p style={{
          fontFamily:   "'DM Sans', sans-serif",
          fontSize:     '0.85rem',
          color:        'rgba(255,255,255,0.5)',
          marginBottom: '2rem',
        }}>
          {user?.email}
        </p>

        {/* Placeholder courses area */}
        <div style={{
          background:   'rgba(255,255,255,0.03)',
          border:       '1px solid rgba(212,175,55,0.1)',
          borderRadius: '12px',
          padding:      '1.5rem',
          marginBottom: '2rem',
          textAlign:    'center',
        }}>
          <p style={{
            fontFamily:    "'DM Sans', sans-serif",
            fontSize:      '0.75rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color:         'rgba(255,255,255,0.25)',
          }}>
            Your courses will appear here — coming in Phase 6
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a
            href="/studio/courses"
            style={{
              flex:          1,
              padding:       '0.8rem',
              borderRadius:  '9999px',
              border:        '1px solid rgba(212,175,55,0.4)',
              color:         '#D4AF37',
              fontFamily:    "'DM Sans', sans-serif",
              fontSize:      '0.68rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight:    600,
              textDecoration:'none',
              textAlign:     'center',
              transition:    'all 0.25s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            Browse Courses
          </a>
          <button
            onClick={handleLogout}
            style={{
              flex:          1,
              padding:       '0.8rem',
              borderRadius:  '9999px',
              border:        '1px solid rgba(255,255,255,0.1)',
              background:    'transparent',
              color:         'rgba(255,255,255,0.4)',
              fontFamily:    "'DM Sans', sans-serif",
              fontSize:      '0.68rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight:    600,
              cursor:        'pointer',
              transition:    'all 0.25s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,100,100,0.8)'; e.currentTarget.style.borderColor = 'rgba(255,100,100,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          >
            Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  )
}
