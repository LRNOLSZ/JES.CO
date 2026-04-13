import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'

// Lock icon
function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 14, height: 14 }}>
      <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

// Clock icon
function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={{ width: 13, height: 13 }}>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export default function CourseCard({ course, onTrailerClick }) {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)

  const tier = course.tier || {}
  const badgeColor = tier.badge_color || '#D4AF37'

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        background:   'rgba(255,255,255,0.04)',
        border:       '1px solid var(--glass-border)',
        borderRadius: '1rem',
        overflow:     'hidden',
        display:      'flex',
        flexDirection:'column',
        cursor:       'pointer',
      }}
      onClick={() => navigate(`/studio/courses/${course.slug}`)}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden' }}>
        {course.thumbnail_url && !imgError ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            draggable={false}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, rgba(96,38,158,0.3), rgba(12,10,20,0.8))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '2rem', opacity: 0.4 }}>✦</span>
          </div>
        )}

        {/* Tier badge */}
        <div style={{
          position:      'absolute', top: '0.75rem', right: '0.75rem',
          padding:       '0.2rem 0.65rem',
          borderRadius:  '9999px',
          background:    `${badgeColor}22`,
          border:        `1px solid ${badgeColor}88`,
          color:         badgeColor,
          fontFamily:    "'DM Sans', sans-serif",
          fontSize:      '0.58rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontWeight:    600,
        }}>
          {tier.name || 'Course'}
        </div>

        {/* Lock overlay hint */}
        <div style={{
          position:   'absolute', bottom: '0.75rem', left: '0.75rem',
          display:    'flex', alignItems: 'center', gap: '0.3rem',
          color:      'rgba(255,255,255,0.55)',
          fontFamily: "'DM Sans', sans-serif",
          fontSize:   '0.62rem',
        }}>
          <LockIcon />
          <span>Full course locked</span>
        </div>
      </div>

      {/* Body */}
      <div style={{
        padding:       '1.25rem',
        display:       'flex',
        flexDirection: 'column',
        gap:           '0.6rem',
        flex:          1,
      }}>
        {/* Category */}
        <p style={{
          fontFamily:    "'DM Sans', sans-serif",
          fontSize:      '0.58rem',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color:         'var(--gold)',
        }}>
          {course.category_display}
        </p>

        {/* Title */}
        <h3 style={{
          fontFamily:  "'Playfair Display', serif",
          fontSize:    '1.1rem',
          lineHeight:  1.3,
          color:       'var(--text-primary)',
          margin:      0,
        }}>
          {course.title}
        </h3>

        {/* Description */}
        <p style={{
          fontFamily:          "'DM Sans', sans-serif",
          fontSize:            '0.82rem',
          fontWeight:          300,
          lineHeight:          1.7,
          color:               'var(--text-muted)',
          display:             '-webkit-box',
          WebkitLineClamp:     2,
          WebkitBoxOrient:     'vertical',
          overflow:            'hidden',
          margin:              0,
        }}>
          {course.description}
        </p>

        {/* Footer row */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginTop:      'auto',
          paddingTop:     '0.75rem',
          borderTop:      '1px solid var(--glass-border)',
        }}>
          {/* Duration */}
          {course.duration_display && (
            <span style={{
              display:    'flex', alignItems: 'center', gap: '0.3rem',
              fontFamily: "'DM Sans', sans-serif",
              fontSize:   '0.75rem',
              color:      'var(--text-muted)',
            }}>
              <ClockIcon />
              {course.duration_display}
            </span>
          )}

          {/* Price */}
          {tier.price_display && (
            <span style={{
              fontFamily:  "'DM Sans', sans-serif",
              fontSize:    '0.8rem',
              fontWeight:  600,
              color:       badgeColor,
            }}>
              {tier.price_display}
            </span>
          )}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.25rem' }}>
          <button
            onClick={e => { e.stopPropagation(); onTrailerClick && onTrailerClick(course) }}
            style={{
              flex:          1,
              padding:       '0.6rem 0',
              borderRadius:  '9999px',
              border:        '1px solid var(--glass-border)',
              background:    'transparent',
              color:         'var(--text-secondary)',
              fontFamily:    "'DM Sans', sans-serif",
              fontSize:      '0.68rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor:        'pointer',
              transition:    'border-color 0.3s, color 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            ▶ Trailer
          </button>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/studio/courses/${course.slug}`) }}
            style={{
              flex:          1,
              padding:       '0.6rem 0',
              borderRadius:  '9999px',
              background:    `linear-gradient(135deg, ${badgeColor}cc, ${badgeColor})`,
              border:        'none',
              color:         '#000',
              fontFamily:    "'DM Sans', sans-serif",
              fontSize:      '0.68rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight:    600,
              cursor:        'pointer',
              transition:    'opacity 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            View Course
          </button>
        </div>
      </div>
    </motion.div>
  )
}
