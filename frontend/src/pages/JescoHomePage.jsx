import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'
import BrandVideoSection from '../components/BrandVideoSection'

/* ── Animation helpers ── */
const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 40 },
  whileInView:{ opacity: 1, y: 0 },
  viewport:   { once: true },
  transition: { duration: 0.7, ease: 'easeOut', delay },
})

/* ── Product card data ── */
const products = [
  {
    id:    'makeup',
    label: 'Makeup Sets',
    sub:   'Pigment-rich. Studio-grade. Built for the woman who never blends in.',
    icon:  '✦',
    link:  '/products/makeup',
  },
  {
    id:    'skincare',
    label: 'Skincare Sets',
    sub:   'Formulated for radiance. Science-backed, luxury-finished.',
    icon:  '◈',
    link:  '/products/skincare',
  },
  {
    id:    'collections',
    label: 'Curated Collections',
    sub:   'Seasonal. Intentional. Curated for the connoisseur.',
    icon:  '❋',
    link:  '/products/collections',
  },
]

export default function JescoHomePage() {
  return (
    <div style={{ width: '100%', minHeight: '100vh', background: 'var(--dark-base)', color: 'var(--text-primary)' }}>
      <JescoNavbar />

      {/* ══════════════════════════════════════════
          SECTION 1 — HERO (dark/purple)
      ══════════════════════════════════════════ */}
      <section style={{
        minHeight:      '100vh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        textAlign:      'center',
        padding:        '0 1.5rem',
        position:       'relative',
        overflow:       'hidden',
        background:     'var(--dark-base)',
      }}>
        {/* Deep purple ambient glow */}
        <div style={{
          position:     'absolute',
          top:          '35%',
          left:         '50%',
          transform:    'translate(-50%, -50%)',
          width:        '800px',
          height:       '800px',
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(96,38,158,0.22) 0%, rgba(96,38,158,0.06) 45%, transparent 70%)',
          pointerEvents:'none',
        }} />
        {/* Gold shimmer top-right */}
        <div style={{
          position:     'absolute',
          top:          '-100px',
          right:        '-100px',
          width:        '400px',
          height:       '400px',
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 65%)',
          pointerEvents:'none',
        }} />

        <motion.p
          {...fadeUp(0.1)}
          style={{
            fontFamily:    "'DM Sans', sans-serif",
            fontSize:      '0.65rem',
            letterSpacing: '0.6em',
            textTransform: 'uppercase',
            color:         'var(--gold)',
            marginBottom:  '1.5rem',
          }}
        >
          The Beauty Collective
        </motion.p>

        <motion.h1
          {...fadeUp(0.22)}
          style={{
            fontFamily:  "'Playfair Display', serif",
            fontSize:    'clamp(4rem, 14vw, 9.5rem)',
            fontWeight:  700,
            lineHeight:  0.9,
            background:  'linear-gradient(135deg, var(--gold-light) 0%, var(--gold) 45%, var(--gold-dark) 100%)',
            WebkitBackgroundClip:'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip:'text',
            marginBottom:'1.75rem',
            letterSpacing:'-0.01em',
          }}
        >
          JES.CO
        </motion.h1>

        {/* Thin gold divider */}
        <motion.div
          {...fadeUp(0.32)}
          style={{
            width:        '60px',
            height:       '1px',
            background:   'linear-gradient(to right, transparent, var(--gold), transparent)',
            marginBottom: '1.75rem',
          }}
        />

        <motion.p
          {...fadeUp(0.4)}
          style={{
            fontFamily:  "'DM Sans', sans-serif",
            fontSize:    'clamp(0.9rem, 2.2vw, 1.1rem)',
            fontWeight:  300,
            color:       'var(--text-secondary)',
            maxWidth:    '34rem',
            lineHeight:  1.85,
            marginBottom:'2.75rem',
          }}
        >
          Where beauty meets craft. Luxury makeup, skincare, and studio services — curated for the woman who commands every room.
        </motion.p>

        <motion.div
          {...fadeUp(0.52)}
          style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <a
            href="#products"
            style={{
              padding:       '0.8rem 2.25rem',
              borderRadius:  '9999px',
              background:    'linear-gradient(135deg, var(--gold-light), var(--gold))',
              color:         '#0C0A14',
              fontFamily:    "'DM Sans', sans-serif",
              fontSize:      '0.72rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              textDecoration:'none',
              fontWeight:    700,
              transition:    'opacity 0.3s, transform 0.3s',
              boxShadow:     '0 4px 24px rgba(212,175,55,0.25)',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Explore Products
          </a>
          <Link
            to="/studio"
            style={{
              padding:       '0.8rem 2.25rem',
              borderRadius:  '9999px',
              border:        '1px solid rgba(212,175,55,0.5)',
              color:         'var(--gold)',
              fontFamily:    "'DM Sans', sans-serif",
              fontSize:      '0.72rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              textDecoration:'none',
              transition:    'all 0.3s',
              background:    'rgba(212,175,55,0.04)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = '#000'; e.currentTarget.style.borderColor = 'var(--gold)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.04)'; e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)' }}
          >
            Enter Studio
          </Link>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          style={{
            position:      'absolute',
            bottom:        '2.5rem',
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            gap:           '0.5rem',
          }}
        >
          <span style={{
            fontFamily:    "'DM Sans', sans-serif",
            fontSize:      '0.5rem',
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            color:         'var(--text-muted)',
          }}>Scroll</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            style={{
              width:      '1px',
              height:     '44px',
              background: 'linear-gradient(to bottom, var(--gold), transparent)',
            }}
          />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 2 — PRODUCT LINES (light/ivory)
      ══════════════════════════════════════════ */}
      <section
        id="products"
        style={{
          padding:    'clamp(5rem, 12vw, 9rem) 1.5rem',
          background: 'var(--light-base)',
          position:   'relative',
          overflow:   'hidden',
        }}
      >
        {/* Subtle purple tint top-left corner */}
        <div style={{
          position:     'absolute',
          top:          '-80px',
          left:         '-80px',
          width:        '360px',
          height:       '360px',
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(96,38,158,0.07) 0%, transparent 70%)',
          pointerEvents:'none',
        }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
          <motion.div {...fadeUp()} style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
            <p style={{
              fontFamily:    "'DM Sans', sans-serif",
              fontSize:      '0.65rem',
              letterSpacing: '0.5em',
              textTransform: 'uppercase',
              color:         'var(--purple)',
              marginBottom:  '1rem',
            }}>
              Our Lines
            </p>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize:   'clamp(2rem, 5vw, 3.2rem)',
              color:      'var(--text-dark-primary)',
              marginBottom: '1rem',
            }}>
              Crafted Collections
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize:   '0.9rem',
              fontWeight: 300,
              color:      'var(--text-dark-secondary)',
              maxWidth:   '28rem',
              margin:     '0 auto',
              lineHeight: 1.75,
            }}>
              Each line crafted with intention. Every product a statement.
            </p>
          </motion.div>

          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap:                 '1.75rem',
          }}>
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                {...fadeUp(i * 0.12)}
                whileHover={{ y: -8, boxShadow: '0 24px 64px rgba(96,38,158,0.14)' }}
                style={{
                  background:   '#FFFFFF',
                  borderRadius: '20px',
                  padding:      '2.75rem 2.25rem',
                  border:       '1px solid rgba(96,38,158,0.1)',
                  cursor:       'default',
                  transition:   'transform 0.35s, box-shadow 0.35s',
                  position:     'relative',
                  overflow:     'hidden',
                  boxShadow:    '0 4px 20px rgba(0,0,0,0.06)',
                }}
              >
                {/* Subtle purple top accent */}
                <div style={{
                  position:   'absolute',
                  top:        0, left: 0, right: 0,
                  height:     '3px',
                  background: 'linear-gradient(to right, var(--purple), var(--gold))',
                  borderRadius:'20px 20px 0 0',
                }} />

                <div style={{
                  fontSize:     '1.5rem',
                  color:        'var(--purple)',
                  marginBottom: '1.25rem',
                  opacity:      0.7,
                }}>
                  {p.icon}
                </div>

                <h3 style={{
                  fontFamily:   "'Playfair Display', serif",
                  fontSize:     '1.5rem',
                  color:        'var(--text-dark-primary)',
                  marginBottom: '0.75rem',
                }}>
                  {p.label}
                </h3>
                <p style={{
                  fontFamily:   "'DM Sans', sans-serif",
                  fontSize:     '0.85rem',
                  fontWeight:   300,
                  color:        'var(--text-dark-secondary)',
                  lineHeight:   1.75,
                  marginBottom: '2rem',
                }}>
                  {p.sub}
                </p>

                <Link
                  to={p.link}
                  style={{
                    fontFamily:    "'DM Sans', sans-serif",
                    fontSize:      '0.62rem',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color:         'var(--purple)',
                    fontWeight:    600,
                    textDecoration:'none',
                    transition:    'color 0.3s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--purple)'}
                >
                  Explore →
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <BrandVideoSection />

      {/* ══════════════════════════════════════════
          SECTION 3 — STUDIO FEATURE (dark/purple)
      ══════════════════════════════════════════ */}
      <section
        id="about"
        style={{
          padding:    'clamp(5rem, 12vw, 9rem) 1.5rem',
          background: 'linear-gradient(160deg, #1a0d3d 0%, #0C0A14 45%, #120F1E 100%)',
          position:   'relative',
          overflow:   'hidden',
        }}
      >
        {/* Background orbs */}
        <div style={{
          position:     'absolute',
          bottom:       '-100px',
          right:        '-100px',
          width:        '500px',
          height:       '500px',
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(96,38,158,0.2) 0%, transparent 65%)',
          pointerEvents:'none',
        }} />
        <div style={{
          position:     'absolute',
          top:          '-60px',
          left:         '-60px',
          width:        '300px',
          height:       '300px',
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)',
          pointerEvents:'none',
        }} />

        <div style={{
          maxWidth:            '960px',
          margin:              '0 auto',
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap:                 '4rem',
          alignItems:          'center',
          position:            'relative',
        }}>
          <motion.div {...fadeUp()}>
            <p style={{
              fontFamily:    "'DM Sans', sans-serif",
              fontSize:      '0.65rem',
              letterSpacing: '0.5em',
              textTransform: 'uppercase',
              color:         'var(--gold)',
              marginBottom:  '1rem',
            }}>
              Our Studio
            </p>
            <h2 style={{
              fontFamily:   "'Playfair Display', serif",
              fontSize:     'clamp(1.8rem, 4vw, 2.8rem)',
              color:        'var(--text-primary)',
              lineHeight:   1.15,
              marginBottom: '1.5rem',
            }}>
              Jesres Glam Studio
            </h2>

            {/* Decorative line */}
            <div style={{
              width:        '50px',
              height:       '1px',
              background:   'linear-gradient(to right, var(--gold), transparent)',
              marginBottom: '1.5rem',
            }} />

            <p style={{
              fontFamily:   "'DM Sans', sans-serif",
              fontSize:     '0.9rem',
              fontWeight:   300,
              color:        'var(--text-secondary)',
              lineHeight:   1.85,
              marginBottom: '2.25rem',
            }}>
              The artistry arm of JES.CO. Bridal glam, editorial looks, transformation sessions, and professional training — all under one roof. Serving clients who expect nothing less than extraordinary.
            </p>
            <Link
              to="/studio"
              style={{
                display:       'inline-flex',
                alignItems:    'center',
                gap:           '0.5rem',
                padding:       '0.8rem 2.25rem',
                borderRadius:  '9999px',
                background:    'linear-gradient(135deg, var(--gold-light), var(--gold))',
                color:         '#000',
                fontFamily:    "'DM Sans', sans-serif",
                fontSize:      '0.72rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                textDecoration:'none',
                fontWeight:    700,
                transition:    'opacity 0.3s, transform 0.3s',
                boxShadow:     '0 4px 24px rgba(212,175,55,0.22)',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Enter the Studio →
            </Link>
          </motion.div>

          {/* Stats card */}
          <motion.div
            {...fadeUp(0.2)}
            style={{
              borderRadius: '20px',
              background:   'rgba(255,255,255,0.04)',
              border:       '1px solid rgba(212,175,55,0.15)',
              padding:      '3rem 2.5rem',
              textAlign:    'center',
              backdropFilter:      'blur(12px)',
              WebkitBackdropFilter:'blur(12px)',
              boxShadow:    'inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {[
              { number: '500+', label: 'Transformations' },
              { number: '4.9★', label: 'Client Rating'   },
              { number: '3+',   label: 'Years of Craft'  },
            ].map((stat, i) => (
              <div key={i} style={{ marginBottom: i < 2 ? '2.5rem' : 0 }}>
                <div style={{
                  fontFamily:   "'Playfair Display', serif",
                  fontSize:     '2.5rem',
                  fontWeight:   600,
                  background:   'linear-gradient(135deg, var(--gold-light), var(--gold))',
                  WebkitBackgroundClip:'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip:'text',
                }}>
                  {stat.number}
                </div>
                <div style={{
                  fontFamily:    "'DM Sans', sans-serif",
                  fontSize:      '0.65rem',
                  letterSpacing: '0.35em',
                  textTransform: 'uppercase',
                  color:         'var(--text-muted)',
                  marginTop:     '0.4rem',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 4 — BRAND VALUES (light/neutral)
      ══════════════════════════════════════════ */}
      <section style={{
        padding:    'clamp(5rem, 10vw, 8rem) 1.5rem',
        background: 'var(--light-surface)',
        position:   'relative',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <motion.div {...fadeUp()}>
            <p style={{
              fontFamily:    "'DM Sans', sans-serif",
              fontSize:      '0.65rem',
              letterSpacing: '0.5em',
              textTransform: 'uppercase',
              color:         'var(--purple)',
              marginBottom:  '1rem',
            }}>
              The JES.CO Standard
            </p>
            <h2 style={{
              fontFamily:   "'Playfair Display', serif",
              fontSize:     'clamp(1.8rem, 4.5vw, 3rem)',
              color:        'var(--text-dark-primary)',
              lineHeight:   1.2,
              marginBottom: '1.5rem',
            }}>
              Beauty is not a luxury.<br />
              <em style={{ color: 'var(--purple)' }}>It is a standard.</em>
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize:   '0.95rem',
              fontWeight: 300,
              color:      'var(--text-dark-secondary)',
              maxWidth:   '32rem',
              margin:     '0 auto 3rem',
              lineHeight: 1.85,
            }}>
              From the products we formulate to the services we provide — every JES.CO touchpoint is designed to make you feel seen, elevated, and radiant.
            </p>
          </motion.div>

          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap:                 '2rem',
          }}>
            {[
              { icon: '◈', title: 'Intentional',  body: 'Nothing is an accident. Every formula, every texture, every finish is deliberate.' },
              { icon: '✦', title: 'Elevated',      body: 'Luxury standards at the heart of everything — products and experiences alike.' },
              { icon: '❋', title: 'Inclusive',     body: 'Built for every complexion, every occasion, every version of you.' },
            ].map((v, i) => (
              <motion.div
                key={i}
                {...fadeUp(i * 0.12)}
                style={{ textAlign: 'center' }}
              >
                <div style={{
                  fontSize:     '1.4rem',
                  color:        'var(--purple)',
                  marginBottom: '0.75rem',
                  opacity:      0.75,
                }}>
                  {v.icon}
                </div>
                <h3 style={{
                  fontFamily:   "'Playfair Display', serif",
                  fontSize:     '1.1rem',
                  color:        'var(--text-dark-primary)',
                  marginBottom: '0.5rem',
                }}>
                  {v.title}
                </h3>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize:   '0.82rem',
                  fontWeight: 300,
                  color:      'var(--text-dark-secondary)',
                  lineHeight: 1.7,
                }}>
                  {v.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <JescoFooter />
    </div>
  )
}
