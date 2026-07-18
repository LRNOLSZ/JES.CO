import { useEffect } from 'react'

export default function Modal({ onClose, children, maxWidth = '720px' }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(28,21,15,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth }}>
        {children}
      </div>
    </div>
  )
}
