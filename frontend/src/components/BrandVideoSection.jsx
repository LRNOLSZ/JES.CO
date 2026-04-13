import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

export default function BrandVideoSection() {
  const [video, setVideo]   = useState(null)
  const [ready, setReady]   = useState(false)
  const videoRef            = useRef(null)

  useEffect(() => {
    axios.get('/api/videos/?page=jesoco')
      .then(r => { if (r.data) setVideo(r.data) })
      .catch(() => {})
  }, [])

  if (!video) return null

  return (
    <section style={{
      padding:    'clamp(5rem, 10vw, 8rem) 1.5rem',
      background: 'var(--dark-base)',
      position:   'relative',
      overflow:   'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position:     'absolute',
        top:          '50%',
        left:         '50%',
        transform:    'translate(-50%, -50%)',
        width:        '600px',
        height:       '400px',
        borderRadius: '50%',
        background:   'radial-gradient(ellipse, rgba(96,38,158,0.15) 0%, transparent 70%)',
        pointerEvents:'none',
      }} />

      <div style={{ maxWidth: '820px', margin: '0 auto', position: 'relative' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <p style={{
            fontFamily:    "'DM Sans', sans-serif",
            fontSize:      '0.65rem',
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            color:         'var(--gold)',
            marginBottom:  '1rem',
          }}>
            Meet the Brand
          </p>
          {video.title && (
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize:   'clamp(1.6rem, 4vw, 2.4rem)',
              color:      'var(--text-primary)',
            }}>
              {video.title}
            </h2>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            borderRadius:  '20px',
            overflow:      'hidden',
            border:        '1px solid rgba(212,175,55,0.2)',
            boxShadow:     '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(96,38,158,0.15)',
            background:    '#000',
            position:      'relative',
          }}
        >
          {/* Gold top accent line */}
          <div style={{
            position:   'absolute',
            top: 0, left: 0, right: 0,
            height:     '2px',
            background: 'linear-gradient(to right, transparent, var(--gold), transparent)',
            zIndex:     1,
          }} />

          <video
            ref={videoRef}
            src={video.video_url}
            controls
            playsInline
            onCanPlay={() => setReady(true)}
            style={{
              width:     '100%',
              display:   'block',
              maxHeight: '540px',
              objectFit: 'cover',
              opacity:   ready ? 1 : 0,
              transition:'opacity 0.5s',
            }}
          />
          {!ready && (
            <div style={{
              position:       'absolute',
              inset:          0,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              background:     'rgba(12,10,20,0.8)',
            }}>
              <div style={{
                width: '2rem', height: '2rem', borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.1)',
                borderTopColor: 'var(--gold)',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
