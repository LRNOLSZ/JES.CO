import { useEffect, useState } from 'react'
import axios from 'axios'
import { Reveal, SectionHead } from './Reveal'

function formatRange(startDate, endDate) {
  const opts = { month: 'short', day: 'numeric' }
  const start = new Date(startDate).toLocaleDateString('en-US', opts)
  if (!endDate || endDate === startDate) return start
  const end = new Date(endDate).toLocaleDateString('en-US', opts)
  return `${start} — ${end}`
}

function EventCard({ event, muted }) {
  return (
    <div style={{
      background:   'color-mix(in srgb, var(--bone) 4%, transparent)',
      border:       '1px solid var(--hair)',
      borderRadius: '16px',
      overflow:     'hidden',
      opacity:      muted ? 0.6 : 1,
    }}>
      {event.image_url && (
        <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
          <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ padding: '1.3rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--champ)' }}>
          {formatRange(event.start_date, event.end_date)}
        </p>
        <h3 className="serif" style={{ fontSize: '1.15rem', color: 'var(--bone)', lineHeight: 1.25 }}>{event.title}</h3>
        {event.description && (
          <p style={{ fontFamily: 'var(--sans)', fontSize: '0.82rem', fontWeight: 300, color: 'var(--taupe)', lineHeight: 1.6 }}>
            {event.description}
          </p>
        )}
      </div>
    </div>
  )
}

function EventRow({ label, badgeColor, events, grid }) {
  if (!events.length) return null
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: badgeColor }} />
        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.62rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--taupe)' }}>{label}</p>
      </div>
      <div className={grid ? 'events-grid' : undefined} style={grid ? { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.6rem' } : { display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {events.map(e => <EventCard key={e.id} event={e} muted={!grid} />)}
      </div>
    </div>
  )
}

export default function EventsSection() {
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/announcements/').then(r => setEvents(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading || events.length === 0) return null

  const ongoing  = events.filter(e => e.status === 'ongoing')
  const upcoming = events.filter(e => e.status === 'upcoming')
  const past     = events.filter(e => e.status === 'past')

  return (
    <section id="events" style={{ padding: 'clamp(5rem,11vw,9rem) 0', background: 'var(--ink-3)' }}>
      <div className="wrap">
        <div style={{ marginBottom: '3.5rem' }}>
          <SectionHead
            index="04"
            eyebrow="Workshops & Events"
            title={<span>What's <span className="ital metal-text">next</span></span>}
            sub="Upcoming classes and events with Maame Ama."
            align="center"
          />
        </div>

        <Reveal><EventRow label="Happening Now" badgeColor="#16a34a" events={ongoing}  grid /></Reveal>
        <Reveal delay={0.1}><EventRow label="Upcoming"     badgeColor="#D4AF37" events={upcoming} grid /></Reveal>
        <Reveal delay={0.2}><EventRow label="Past Events"  badgeColor="#6b7280" events={past} /></Reveal>
      </div>
    </section>
  )
}
