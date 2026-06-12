import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'

export default function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (!isAuthenticated) return <Navigate to="/studio/courses" replace />

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>
      <JescoNavbar />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(7rem,14vw,10rem) 1.5rem clamp(4rem,8vw,7rem)' }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          style={{
            width:          '100%',
            maxWidth:       '520px',
            background:     'color-mix(in srgb, var(--bone) 4%, transparent)',
            border:         '1px solid color-mix(in srgb, var(--champ) 25%, transparent)',
            borderRadius:   '20px',
            padding:        '3rem 2.5rem',
            position:       'relative',
          }}
        >
          {/* Champ top accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'var(--metal)', borderRadius: '20px 20px 0 0' }} />

          <p style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.5em', textTransform: 'uppercase', color: 'var(--champ)', marginBottom: '1.25rem' }}>
            Student Portal
          </p>

          <h1 className="serif" style={{ fontSize: 'clamp(1.6rem,4vw,2.2rem)', color: 'var(--bone)', lineHeight: 1.15, marginBottom: '0.5rem' }}>
            Welcome back{user?.first_name ? `, ${user.first_name}` : ''}.
          </h1>

          <p style={{ fontFamily: 'var(--sans)', fontSize: '0.85rem', color: 'var(--taupe-mut)', marginBottom: '2rem' }}>
            {user?.email}
          </p>

          {/* Placeholder courses area */}
          <div style={{ background: 'color-mix(in srgb, var(--bone) 3%, transparent)', border: '1px solid var(--hair)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--taupe-mut)' }}>
              Your courses will appear here — coming in Phase 6
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="/studio/courses" className="btn btn-ghost" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
              Browse Courses
            </a>
            <button
              onClick={handleLogout}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '9999px', border: '1px solid var(--hair)', background: 'transparent', color: 'var(--taupe-mut)', fontFamily: 'var(--sans)', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(220,80,80,0.8)'; e.currentTarget.style.borderColor = 'rgba(220,80,80,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--taupe-mut)'; e.currentTarget.style.borderColor = 'var(--hair)' }}
            >
              Sign Out
            </button>
          </div>
        </motion.div>
      </main>

      <JescoFooter />
    </div>
  )
}
