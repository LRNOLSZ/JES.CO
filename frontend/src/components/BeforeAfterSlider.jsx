import { useRef, useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'

export default function BeforeAfterSlider({ beforeImage, afterImage, title, category }) {
  const containerRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const x = useMotionValue(0.5)
  const clipPercent = useTransform(x, v => `${v * 100}%`)

  const handleDrag = (e) => {
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0.02), 0.98)
    x.set(ratio)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* Image container */}
      <div
        ref={containerRef}
        style={{
          position:      'relative',
          overflow:      'hidden',
          borderRadius:  '0.875rem',
          aspectRatio:   '3 / 4',
          cursor:        'ew-resize',
          userSelect:    'none',
          WebkitUserSelect: 'none',
        }}
        onMouseDown={() => setDragging(true)}
        onMouseMove={(e) => dragging && handleDrag(e)}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onTouchMove={handleDrag}
      >

        {/* Before — full width, sits behind */}
        <img
          src={beforeImage}
          alt={`${title} — Before`}
          draggable={false}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />

        {/* After — clipped to left portion */}
        <motion.div style={{
          position: 'absolute', inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          width: clipPercent,
        }}>
          <img
            src={afterImage}
            alt={`${title} — After`}
            draggable={false}
            style={{
              position: 'absolute', inset: 0,
              width: containerRef.current?.offsetWidth ?? '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </motion.div>

        {/* Gold divider line */}
        <motion.div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: clipPercent,
          width: '1px',
          background: 'linear-gradient(to bottom, transparent, var(--gold), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Handle circle */}
        <motion.div style={{
          position:  'absolute',
          top:       '50%',
          left:      clipPercent,
          transform: 'translate(-50%, -50%)',
          width:  38, height: 38,
          borderRadius: '50%',
          background:   'rgba(12,10,20,0.78)',
          border:       '1.5px solid var(--gold)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          pointerEvents:'none',
        }}>
          <svg viewBox="0 0 20 20" fill="none" style={{ width: 14, height: 14 }}>
            <path d="M7 5l-4 5 4 5" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13 5l4 5-4 5" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>

        {/* Before label */}
        <div style={{ position: 'absolute', bottom: '0.875rem', left: '0.875rem' }}>
          <span style={{
            fontFamily:    "'DM Sans', sans-serif",
            fontSize:      '0.58rem', letterSpacing: '0.2em',
            textTransform: 'uppercase',
            padding:       '0.2rem 0.5rem', borderRadius: '4px',
            background:    'rgba(12,10,20,0.65)',
            color:         'var(--text-muted)',
            backdropFilter:'blur(4px)',
          }}>
            Before
          </span>
        </div>

        {/* After label */}
        <div style={{ position: 'absolute', bottom: '0.875rem', right: '0.875rem' }}>
          <span style={{
            fontFamily:    "'DM Sans', sans-serif",
            fontSize:      '0.58rem', letterSpacing: '0.2em',
            textTransform: 'uppercase',
            padding:       '0.2rem 0.5rem', borderRadius: '4px',
            background:    'rgba(12,10,20,0.65)',
            color:         'var(--gold)',
            backdropFilter:'blur(4px)',
          }}>
            After
          </span>
        </div>
      </div>

      {/* Caption */}
      <div style={{ textAlign: 'center', padding: '0 0.25rem' }}>
        <p style={{
          fontFamily:    "'DM Sans', sans-serif",
          fontSize:      '0.62rem', letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'var(--gold)',
        }}>
          {category}
        </p>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize:   '0.85rem', marginTop: '0.25rem',
          color:      'var(--text-secondary)',
        }}>
          {title}
        </p>
      </div>
    </div>
  )
}
