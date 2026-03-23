import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

// Placeholder avatar initials when no photo uploaded
function Avatar({ src, name, size = 64 }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size, height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid var(--gold)',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--purple), var(--purple-light))',
      border: '2px solid var(--gold)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      fontFamily: "'Playfair Display', serif",
      fontSize: size * 0.3,
      color: 'var(--gold)',
      letterSpacing: '0.05em',
    }}>
      {initials}
    </div>
  )
}

// Quotation mark SVG
function QuoteIcon() {
  return (
    <svg viewBox="0 0 32 24" fill="none" style={{ width: 28, height: 22, opacity: 0.4 }}>
      <path d="M0 24V14.4C0 6.4 4.8 1.6 14.4 0l1.6 3.2C10.4 4.8 7.2 8 6.4 12H12V24H0zm20 0V14.4C20 6.4 24.8 1.6 34.4 0l1.6 3.2C30.4 4.8 27.2 8 26.4 12H32V24H20z"
        fill="var(--gold)" />
    </svg>
  )
}

export default function TestimonialsSection() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const dragStart = useRef(null)

  useEffect(() => {
    axios.get('/api/testimonials/')
      .then(r => setItems(r.data))
      .finally(() => setLoading(false))
  }, [])

  const total = items.length
  if (!loading && total === 0) return null  // hide section entirely if no testimonials

  const goTo = (index) => {
    setCurrent(((index % total) + total) % total)
  }
  const prev = () => goTo(current - 1)
  const next = () => goTo(current + 1)

  // Which offsets to render: -2, -1, 0, 1, 2 (fewer if not enough items)
  const offsets = total >= 5 ? [-2, -1, 0, 1, 2]
                : total === 4 ? [-1, 0, 1, 2]
                : total === 3 ? [-1, 0, 1]
                : total === 2 ? [0, 1]
                : [0]

  // Visual scale & opacity per position
  const styleAt = (offset) => {
    const abs = Math.abs(offset)
    if (abs === 0) return { scale: 1,    opacity: 1,    zIndex: 3 }
    if (abs === 1) return { scale: 0.82, opacity: 0.72, zIndex: 2 }
    return              { scale: 0.65,  opacity: 0.42, zIndex: 1 }
  }

  // Card width at each position
  const widthAt = (offset) => {
    const abs = Math.abs(offset)
    if (abs === 0) return 'min(320px, 88vw)'
    if (abs === 1) return 'min(260px, 70vw)'
    return              'min(200px, 55vw)'
  }

  return (
    <section style={{
      width:      '100%',
      minHeight:  '100vh',
      background: 'var(--dark-surface)',
      display:    'flex',
      alignItems: 'center',
      overflow:   'hidden',
      position:   'relative',
    }}>

      {/* Subtle gold glow top-centre */}
      <div style={{
        position: 'absolute', top: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '600px', height: '1px',
        background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.3), transparent)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width:       '100%',
        marginLeft:  'auto',
        marginRight: 'auto',
        padding:     '6rem 0',
        display:     'flex',
        flexDirection: 'column',
        alignItems:  'center',
        gap:         '3.5rem',
      }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', padding: '0 1.5rem' }}
        >
          <p style={{
            fontFamily:    "'DM Sans', sans-serif",
            fontSize:      '0.65rem',
            letterSpacing: '0.45em',
            textTransform: 'uppercase',
            color:         'var(--gold)',
            marginBottom:  '1rem',
          }}>
            What Clients Say
          </p>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize:   'clamp(2rem, 6vw, 3.5rem)',
            color:      'var(--text-primary)',
          }}>
            Experiences
          </h2>
        </motion.div>

        {/* Carousel */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
            <div style={{
              width: '2rem', height: '2rem', borderRadius: '50%',
              border: '2px solid var(--glass-border)',
              borderTopColor: 'var(--gold)',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : (
          <div
            style={{ width: '100%', position: 'relative' }}
            onMouseDown={e  => { dragStart.current = e.clientX }}
            onMouseUp={e    => {
              if (dragStart.current === null) return
              const delta = e.clientX - dragStart.current
              if (delta < -40) next()
              else if (delta > 40) prev()
              dragStart.current = null
            }}
            onTouchStart={e => { dragStart.current = e.touches[0].clientX }}
            onTouchEnd={e   => {
              if (dragStart.current === null) return
              const delta = e.changedTouches[0].clientX - dragStart.current
              if (delta < -40) next()
              else if (delta > 40) prev()
              dragStart.current = null
            }}
          >
            {/* Cards row */}
            <div style={{
              display:        'flex',
              justifyContent: 'center',
              alignItems:     'center',
              gap:            '1rem',
              padding:        '2rem 1rem',
              cursor:         'grab',
              userSelect:     'none',
              WebkitUserSelect: 'none',
            }}>
              {offsets.map(offset => {
                const idx  = ((current + offset) % total + total) % total
                const item = items[idx]
                const { scale, opacity, zIndex } = styleAt(offset)
                const isCenter = offset === 0

                return (
                  <motion.div
                    key={item.id}
                    layout
                    animate={{ scale, opacity }}
                    transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                    onClick={() => !isCenter && goTo(current + offset)}
                    style={{
                      width:        widthAt(offset),
                      flexShrink:   0,
                      zIndex,
                      cursor:       isCenter ? 'default' : 'pointer',
                    }}
                  >
                    <div style={{
                      background:   isCenter
                        ? 'rgba(255,255,255,0.07)'
                        : 'rgba(255,255,255,0.03)',
                      border:       `1px solid ${isCenter ? 'rgba(212,175,55,0.3)' : 'var(--glass-border)'}`,
                      borderRadius: '1rem',
                      padding:      isCenter ? '2rem 1.75rem' : '1.5rem 1.25rem',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      transition:   'padding 0.55s cubic-bezier(0.4,0,0.2,1)',
                      display:      'flex',
                      flexDirection:'column',
                      gap:          '1.25rem',
                    }}>

                      {/* Quote icon */}
                      {isCenter && <QuoteIcon />}

                      {/* Comment */}
                      <p style={{
                        fontFamily:  "'DM Sans', sans-serif",
                        fontSize:    isCenter ? '1.05rem' : '0.88rem',
                        fontWeight:  300,
                        lineHeight:  1.8,
                        color:       isCenter ? 'var(--text-secondary)' : 'var(--text-muted)',
                        display:     '-webkit-box',
                        WebkitLineClamp: isCenter ? 'unset' : 3,
                        WebkitBoxOrient: 'vertical',
                        overflow:    isCenter ? 'visible' : 'hidden',
                        transition:  'font-size 0.55s cubic-bezier(0.4,0,0.2,1)',
                      }}>
                        {item.comment}
                      </p>

                      {/* Author row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Avatar
                          src={item.profile_picture_url}
                          name={item.name}
                          size={isCenter ? 48 : 36}
                        />
                        <div>
                          <p style={{
                            fontFamily:  "'DM Sans', sans-serif",
                            fontSize:    isCenter ? '1rem' : '0.85rem',
                            fontWeight:  600,
                            color:       'var(--text-primary)',
                            lineHeight:  1.2,
                          }}>
                            {item.name}
                          </p>
                          {item.location && (
                            <p style={{
                              fontFamily:  "'DM Sans', sans-serif",
                              fontSize:    '0.78rem',
                              color:       'var(--text-muted)',
                              marginTop:   '0.2rem',
                              letterSpacing: '0.05em',
                            }}>
                              {item.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Arrow buttons */}
            {total > 1 && (
              <>
                {/* Prev — desktop only */}
                <button
                  onClick={prev}
                  aria-label="Previous testimonial"
                  className="hidden md:flex"
                  style={{
                    position:       'absolute', left: '1rem', top: '50%',
                    transform:      'translateY(-50%)',
                    width: 40, height: 40, borderRadius: '50%',
                    background:     'rgba(12,10,20,0.7)',
                    border:         '1px solid var(--glass-border)',
                    color:          'var(--gold)',
                    cursor:         'pointer',
                    alignItems:     'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(8px)',
                    transition:     'border-color 0.3s',
                    zIndex:         10,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)' }}
                >
                  <svg viewBox="0 0 20 20" fill="none" style={{ width: 16, height: 16 }}>
                    <path d="M13 15l-5-5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Next — desktop only */}
                <button
                  onClick={next}
                  aria-label="Next testimonial"
                  className="hidden md:flex"
                  style={{
                    position:       'absolute', right: '1rem', top: '50%',
                    transform:      'translateY(-50%)',
                    width: 40, height: 40, borderRadius: '50%',
                    background:     'rgba(12,10,20,0.7)',
                    border:         '1px solid var(--glass-border)',
                    color:          'var(--gold)',
                    cursor:         'pointer',
                    alignItems:     'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(8px)',
                    transition:     'border-color 0.3s',
                    zIndex:         10,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)' }}
                >
                  <svg viewBox="0 0 20 20" fill="none" style={{ width: 16, height: 16 }}>
                    <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}

        {/* Dot indicators */}
        {total > 1 && !loading && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                style={{
                  width:      i === current ? '1.5rem' : '0.4rem',
                  height:     '0.4rem',
                  borderRadius: '9999px',
                  background: i === current ? 'var(--gold)' : 'var(--glass-border)',
                  border:     'none',
                  cursor:     'pointer',
                  padding:    0,
                  transition: 'all 0.4s ease',
                }}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  )
}
