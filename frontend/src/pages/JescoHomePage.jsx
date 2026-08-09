import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'
import { Reveal, ArrowIcon, SectionHead } from '../components/Reveal'
import { usePageImages } from '../hooks/usePageImages'
import BrandVideoSection from '../components/BrandVideoSection'
import SEO from '../components/SEO'

/* ═══════════════════════════════════════════
   DATA
═══════════════════════════════════════════ */
const LINES = [
  { id: 'makeup',      icon: '✦', label: 'Makeup Sets',        sub: 'Pigment-rich. Studio-grade. Built for the woman who never blends in.' },
  { id: 'skincare',    icon: '◈', label: 'Skincare Sets',       sub: 'Formulated for radiance. Science-backed, luxury-finished.' },
  { id: 'collections', icon: '❋', label: 'Curated Collections', sub: 'Seasonal. Intentional. Curated for the connoisseur.' },
]

const VALUES = [
  { icon: '◈', title: 'Intentional', body: 'Nothing is an accident. Every formula, every texture, every finish is deliberate.' },
  { icon: '✦', title: 'Elevated',    body: 'Luxury standards at the heart of everything — products and experiences alike.' },
  { icon: '❋', title: 'Inclusive',   body: 'Built for every complexion, every occasion, every version of you.' },
]

const STATS = [
  { n: '200+', label: 'Transformations' },
  { n: '4.9★', label: 'Client Rating' },
  { n: '3+',   label: 'Years of Craft' },
]

const MARQUEE_WORDS = ['Makeup', 'Skincare', 'Collections', 'Bridal Glam', 'Editorial', 'Training']

/* ═══════════════════════════════════════════
   HERO — Full-Bleed Editorial
═══════════════════════════════════════════ */
function HomeHero({ heroUrl }) {
  return (
    <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: 'var(--ink-2)' }}>

      {/* Full-bleed background image — only renders once the DB URL is available */}
      {heroUrl && (
        <img
          src={heroUrl}
          alt=""
          aria-hidden="true"
          style={{
            position:       'absolute',
            inset:          0,
            width:          '100%',
            height:         '100%',
            objectFit:      'cover',
            objectPosition: 'center center',
          }}
        />
      )}

      {/* Legibility scrims */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(15,12,10,0.84) 0%, rgba(15,12,10,0.38) 44%, rgba(15,12,10,0.14) 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 55% at 28% 82%, var(--plum), transparent 70%)',
        opacity: 0.13,
      }} />

      {/* EST. 2023 vertical marker */}
      <div className="hero-vmark" style={{
        position: 'absolute', right: '2.2rem', top: '52%',
        transform: 'translateY(-50%)', display: 'flex',
        flexDirection: 'column', alignItems: 'center', gap: '1rem', zIndex: 3,
      }}>
        <span className="v-label" style={{ color: 'rgba(243,237,227,0.55)' }}>EST. 2023</span>
        <span style={{ width: '1px', height: '70px', background: 'linear-gradient(var(--champ), transparent)' }} />
      </div>

      {/* Content — bottom-left */}
      <div className="wrap" style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        bottom: 'clamp(2.6rem,6vh,5rem)', zIndex: 3,
      }}>
        <div style={{ maxWidth: '42rem' }}>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.4,0,0.2,1] }}
            className="eyebrow"
            style={{ color: 'var(--champ)', marginBottom: '1.4rem' }}
          >
            The Beauty Collective
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.28, ease: [0.4,0,0.2,1] }}
            style={{
              fontFamily:    'var(--serif)',
              fontSize:      'clamp(2.9rem,8.6vw,6rem)',
              fontWeight:    600,
              lineHeight:    0.96,
              letterSpacing: '-0.01em',
              color:         '#F3EDE3',
              marginBottom:  '1.5rem',
            }}
          >
            Where Beauty<br />
            <span className="ital metal-text" style={{ fontWeight: 500 }}>Meets&nbsp;Craft</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.42, ease: [0.4,0,0.2,1] }}
            style={{
              fontFamily:  'var(--sans)',
              fontSize:    'clamp(0.95rem,1.4vw,1.08rem)',
              fontWeight:  300,
              lineHeight:  1.8,
              color:       'rgba(243,237,227,0.82)',
              maxWidth:    '31rem',
              marginBottom:'2.2rem',
            }}
          >
            Luxury makeup, skincare, and studio services — curated for the woman who commands every room. Every product a statement, every service an experience.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.56, ease: [0.4,0,0.2,1] }}
            className="hero-cta"
            style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap' }}
          >
            <a href="#lines" className="btn btn-gold">Explore Products</a>
            <Link
              to="/studio"
              className="btn btn-ghost"
              style={{ color: '#F3EDE3', borderColor: 'rgba(243,237,227,0.3)' }}
            >
              Enter the Studio <ArrowIcon />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="hero-scroll" style={{
        position: 'absolute', bottom: '2rem', right: '2.4rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 3,
      }}>
        <span style={{
          fontFamily:    'var(--sans)',
          fontSize:      '0.5rem',
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          color:         'rgba(243,237,227,0.5)',
        }}>Scroll</span>
        <motion.span
          animate={{ scaleY: [1, 0.6, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          style={{
            display:    'block',
            width:      '1px',
            height:     '40px',
            background: 'linear-gradient(rgba(243,237,227,0.6), transparent)',
            transformOrigin: 'top',
          }}
        />
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   MARQUEE
═══════════════════════════════════════════ */
function HomeMarquee() {
  const seq = [...MARQUEE_WORDS, ...MARQUEE_WORDS]
  return (
    <section aria-hidden="true" style={{
      borderTop:   '1px solid var(--hair)',
      borderBottom:'1px solid var(--hair)',
      padding:     '2.2rem 0',
      overflow:    'hidden',
      background:  'var(--ink-2)',
    }}>
      <div className="marquee-track" style={{ display: 'flex', width: 'max-content', animation: 'marquee 32s linear infinite' }}>
        {seq.map((w, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '2.4rem', paddingRight: '2.4rem' }}>
            <span className="serif ital" style={{
              fontSize:    'clamp(1.6rem,3.4vw,2.7rem)',
              fontWeight:  500,
              color:       'var(--bone)',
              opacity:     0.92,
              whiteSpace:  'nowrap',
            }}>{w}</span>
            <span style={{ color: 'var(--champ)', fontSize: '0.8rem' }}>✦</span>
          </span>
        ))}
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   PRODUCT LINES
═══════════════════════════════════════════ */
function ProductLines() {
  return (
    <section id="lines" style={{ padding: 'clamp(5rem,11vw,9rem) 0' }}>
      <div className="wrap">
        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead
            index="01"
            eyebrow="Our Lines"
            title={<span>Crafted <span className="ital metal-text">collections</span></span>}
            sub="Each line crafted with intention. Every product a statement."
            align="center"
          />
        </div>

        <div className="lines-grid" style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap:                 '1.8rem',
        }}>
          {LINES.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.1}>
              <Link to={`/products/${p.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                <LineCard p={p} />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function LineCard({ p }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:    'relative',
        height:      '100%',
        display:     'flex',
        flexDirection:'column',
        background:  'color-mix(in srgb, var(--bone) 4%, transparent)',
        border:      `1px solid ${hovered ? 'color-mix(in srgb, var(--champ) 45%, transparent)' : 'var(--hair)'}`,
        borderRadius:'18px',
        padding:     '2.6rem 2.1rem',
        transform:   hovered ? 'translateY(-8px)' : 'none',
        transition:  'transform 0.4s var(--ease), border-color 0.4s',
        overflow:    'hidden',
      }}
    >
      {/* Gold top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--metal)' }} />
      <div style={{ fontSize: '1.5rem', color: 'var(--champ)', marginBottom: '1.3rem' }}>{p.icon}</div>
      <h3 className="serif" style={{ fontSize: '1.6rem', color: 'var(--bone)', marginBottom: '0.7rem' }}>{p.label}</h3>
      <p style={{ fontFamily: 'var(--sans)', fontSize: '0.86rem', fontWeight: 300, color: 'var(--taupe)', lineHeight: 1.75, marginBottom: '2rem', flex: 1 }}>{p.sub}</p>
      <span style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           '0.5rem',
        fontFamily:    'var(--sans)',
        fontSize:      '0.62rem',
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color:         'var(--champ)',
        fontWeight:    600,
      }}>
        Explore <ArrowIcon />
      </span>
    </div>
  )
}

/* ═══════════════════════════════════════════
   STUDIO FEATURE
═══════════════════════════════════════════ */
function StudioFeature({ studioFeatureUrl }) {
  return (
    <section style={{ padding: 'clamp(5rem,11vw,9rem) 0', background: 'var(--ink-3)', overflow: 'hidden', position: 'relative' }}>
      {/* Plum glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 65% 55% at 70% 40%, var(--plum), transparent 70%)',
        opacity: 'var(--glow-plum)',
      }} />

      <div className="wrap studio-grid" style={{
        position:            'relative',
        zIndex:              2,
        display:             'grid',
        gridTemplateColumns: '1.05fr 0.95fr',
        gap:                 'clamp(2.5rem,6vw,5rem)',
        alignItems:          'center',
      }}>
        <div>
          <SectionHead
            index="02"
            eyebrow="Our Studio"
            title={<span>Jesres <span className="ital metal-text">Glam Studio</span></span>}
            sub="The artistry arm of JES.CO. Bridal glam, editorial looks, transformation sessions, and professional training — all under one roof, for clients who expect nothing less than extraordinary."
          />
          <Reveal delay={0.2} style={{ marginTop: '2.2rem' }}>
            <Link to="/studio" className="btn btn-gold">Enter the Studio <ArrowIcon /></Link>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="studio-img" style={{ position: 'relative' }}>
          {/* Studio feature image */}
          {studioFeatureUrl
            ? <img src={studioFeatureUrl} alt="Studio" style={{ width: '100%', aspectRatio: '4 / 4.4', borderRadius: '14px', objectFit: 'cover', display: 'block' }} />
            : <div className="ph" style={{ width: '100%', aspectRatio: '4 / 4.4', borderRadius: '14px', display: 'block' }}><span className="ph-tag">Studio Image</span></div>
          }

          {/* Stats bar overlaid across bottom of image */}
          <div style={{
            position:            'absolute',
            left: 0, right: 0, bottom: 0,
            display:             'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap:                 '1px',
            background:          'var(--hair)',
            borderTop:           '1px solid var(--hair)',
            borderRadius:        '0 0 14px 14px',
            overflow:            'hidden',
          }}>
            {STATS.map(s => (
              <div key={s.label} style={{
                background:    'color-mix(in srgb, var(--ink) 78%, transparent)',
                backdropFilter:'blur(8px)',
                padding:       '1rem 0.6rem',
                textAlign:     'center',
              }}>
                <div className="serif" style={{ fontSize: '1.5rem', fontWeight: 600, lineHeight: 1 }}>
                  <span className="metal-text">{s.n}</span>
                </div>
                <div style={{
                  fontFamily:    'var(--sans)',
                  fontSize:      '0.5rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color:         'var(--taupe-mut)',
                  marginTop:     '0.35rem',
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   BRAND VALUES
═══════════════════════════════════════════ */
function BrandValues() {
  return (
    <section style={{ padding: 'clamp(5rem,11vw,9rem) 0' }}>
      <div className="wrap" style={{ maxWidth: '960px' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <Reveal style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', justifyContent: 'center', marginBottom: '1.1rem' }}>
            <span style={{ width: '26px', height: '1px', background: 'var(--champ)', opacity: 0.6 }} />
            <span className="eyebrow">The JES.CO Standard</span>
          </Reveal>
          <Reveal delay={0.06} as="h2" style={{ fontSize: 'clamp(2rem,4.8vw,3.3rem)', fontWeight: 500, lineHeight: 1.12 }}>
            Beauty is not a luxury.<br /><span className="ital metal-text">It is a standard.</span>
          </Reveal>
          <Reveal delay={0.12} as="p" style={{
            fontFamily: 'var(--sans)', fontSize: '0.95rem', fontWeight: 300,
            color: 'var(--taupe)', maxWidth: '32rem', margin: '1.3rem auto 0', lineHeight: 1.85,
          }}>
            From the products we formulate to the services we provide — every JES.CO touchpoint is designed to make you feel seen, elevated, and radiant.
          </Reveal>
        </div>

        <div className="values-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2.4rem' }}>
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.12} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', color: 'var(--champ)', marginBottom: '1rem' }}>{v.icon}</div>
              <h3 className="serif" style={{ fontSize: '1.3rem', color: 'var(--bone)', marginBottom: '0.6rem' }}>{v.title}</h3>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.85rem', fontWeight: 300, color: 'var(--taupe)', lineHeight: 1.75 }}>{v.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   PAGE
═══════════════════════════════════════════ */
// TODO: swap jes-co.vercel.app for the real jes.co domain once purchased
// (same TODO already applied to robots.txt, sitemap.xml, llms.txt, index.html OG tags)
const JES_CO_ORGANIZATION_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'JES.CO',
  url: 'https://jes-co.vercel.app/',
  logo: 'https://jes-co.vercel.app/og-image.png',
  description: 'JES.CO — a beauty brand and collective. Explore Jesres Glam Studio, our courses, and our product lines.',
}

export default function JescoHomePage() {
  const images = usePageImages()
  return (
    <div style={{ width: '100%', minHeight: '100vh', background: 'var(--ink)', color: 'var(--bone)' }}>
      <SEO
        title="JES.CO — The Beauty Collective"
        description="JES.CO — a beauty brand and collective. Explore Jesres Glam Studio, our courses, and our product lines."
        jsonLd={JES_CO_ORGANIZATION_JSONLD}
      />
      <JescoNavbar overDark />
      <HomeHero heroUrl={images.home_hero_url} />
      <HomeMarquee />
      <BrandVideoSection />
      <ProductLines />
      <StudioFeature studioFeatureUrl={images.home_studio_feature_url} />
      <BrandValues />
      <JescoFooter />
    </div>
  )
}
