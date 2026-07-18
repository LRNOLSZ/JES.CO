import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import axios from 'axios'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'
import { BeforeAfterCard } from '../components/BeforeAfterSlider'
import { StarRow } from '../components/TestimonialsSection'

function QuoteCard({ t }) {
  return (
    <div style={{ padding: '2rem', background: 'color-mix(in srgb, var(--bone) 4%, transparent)', border: '1px solid var(--hair)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.1rem', height: '100%' }}>
      <StarRow count={t.rating || 5} />
      <blockquote className="serif ital" style={{ fontSize: '1.05rem', fontWeight: 400, lineHeight: 1.6, color: 'var(--bone)', margin: 0, flex: 1 }}>
        {t.quote}
      </blockquote>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {t.avatar_url
          ? <img src={t.avatar_url} alt={t.client_name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid color-mix(in srgb, var(--champ) 40%, transparent)' }} />
          : <span style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--hair)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--champ)', fontSize: '1rem' }}>
              {(t.client_name || 'C').charAt(0)}
            </span>
        }
        <div>
          <div className="serif" style={{ fontSize: '0.9rem', color: 'var(--bone)' }}>{t.client_name}</div>
          {(t.service || t.location) && (
            <div style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--taupe-mut)' }}>
              {[t.service, t.location].filter(Boolean).join(' — ')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TestimonialGroup({ title, items }) {
  if (!items.length) return null
  return (
    <div style={{ marginBottom: '4rem' }}>
      <p style={{ fontFamily: 'var(--sans)', fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--champ)', marginBottom: '1.75rem' }}>
        {title}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px,100%),1fr))', gap: '2rem' }}>
        {items.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.05 }}>
            {t.before_image_url && t.after_image_url
              ? <BeforeAfterCard title={t.client_name} category={t.service || title} beforeImage={t.before_image_url} afterImage={t.after_image_url} />
              : <QuoteCard t={t} />
            }
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState([])
  const [loading,       setLoading]      = useState(true)

  useEffect(() => {
    axios.get('/api/testimonials/')
      .then(r => setTestimonials(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const clients  = testimonials.filter(t => t.testimonial_type !== 'student')
  const students  = testimonials.filter(t => t.testimonial_type === 'student')

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--ink)' }}>
      <JescoNavbar />

      <main style={{ flex: 1, paddingTop: '7rem', paddingBottom: 'clamp(4rem,8vw,7rem)' }}>
        <div className="wrap">

          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} style={{ marginBottom: '3.5rem' }}>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--champ)', marginBottom: '0.6rem' }}>Success Stories</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <h1 className="serif" style={{ fontSize: 'clamp(2.2rem,7vw,4rem)', color: 'var(--bone)' }}>
                Real <span className="ital metal-text">Results</span>
              </h1>
              <Link to="/studio" style={{ fontFamily: 'var(--sans)', fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--taupe-mut)', textDecoration: 'none' }}>
                ← Back to Studio
              </Link>
            </div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '0.88rem', fontWeight: 300, color: 'var(--taupe)', marginTop: '0.75rem', lineHeight: 1.7, maxWidth: '30rem' }}>
              What clients and students say — in their own words.
            </p>
            <div style={{ width: '52px', height: '1px', background: 'var(--metal)', marginTop: '1.4rem' }} />
          </motion.div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', border: '2px solid var(--hair)', borderTopColor: 'var(--champ)', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : testimonials.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <span style={{ fontFamily: 'var(--sans)', fontSize: '0.75rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--taupe-mut)' }}>
                No testimonials published yet
              </span>
            </div>
          ) : (
            <>
              <TestimonialGroup title="Client Transformations" items={clients} />
              <TestimonialGroup title="Student Success Stories" items={students} />
            </>
          )}
        </div>
      </main>

      <JescoFooter />
    </div>
  )
}
