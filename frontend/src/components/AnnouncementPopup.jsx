import { useEffect, useState } from 'react'
import axios from 'axios'
import Modal from './Modal'

const DELAY_MS = 30000

export default function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      axios.get('/api/announcements/featured/').then(r => {
        const a = r.data
        if (!a) return
        const dismissKey = `jes_announcement_dismissed_${a.id}`
        if (sessionStorage.getItem(dismissKey)) return
        setAnnouncement(a)
      }).catch(() => {})
    }, DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (!announcement) return null

  function handleClose() {
    sessionStorage.setItem(`jes_announcement_dismissed_${announcement.id}`, '1')
    setAnnouncement(null)
  }

  return (
    <Modal onClose={handleClose} maxWidth="480px">
      <div style={{ background: 'var(--ink-3)', border: '1px solid var(--hair)', borderRadius: '16px', overflow: 'hidden' }}>
        {announcement.image_url && (
          <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
            <img src={announcement.image_url} alt={announcement.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ padding: '1.75rem', position: 'relative' }}>
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--taupe-mut)', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1 }}
          >
            ✕
          </button>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--champ)', marginBottom: '0.6rem' }}>
            {announcement.status === 'ongoing' ? 'Happening Now' : 'Upcoming'}
          </p>
          <h3 className="serif" style={{ fontSize: '1.4rem', color: 'var(--bone)', marginBottom: '0.6rem', paddingRight: '1.5rem' }}>
            {announcement.title}
          </h3>
          {announcement.description && (
            <p style={{ fontFamily: 'var(--sans)', fontSize: '0.85rem', fontWeight: 300, color: 'var(--taupe)', lineHeight: 1.6 }}>
              {announcement.description}
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
