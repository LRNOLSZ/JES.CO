import { useState } from 'react'
import axios from 'axios'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB, matches the backend validator

const inputStyle = {
  width:        '100%',
  boxSizing:    'border-box',
  padding:      '0.75rem 1rem',
  background:   'color-mix(in srgb, var(--bone) 5%, transparent)',
  border:       '1px solid var(--hair)',
  borderRadius: '10px',
  color:        'var(--bone)',
  fontFamily:   'var(--sans)',
  fontSize:     '0.85rem',
  outline:      'none',
}

function validateImage(file) {
  if (!file) return null // photos are optional
  if (!file.type.startsWith('image/')) return 'Only image files are allowed.'
  if (file.size > MAX_SIZE) return 'Each photo must be 5MB or smaller.'
  return null
}

export default function TestimonialSubmitForm({ slug, sessionKey, onDone }) {
  const [name,        setName]        = useState('')
  const [body,         setBody]        = useState('')
  const [beforeFile,   setBeforeFile]  = useState(null)
  const [afterFile,    setAfterFile]   = useState(null)
  const [state,        setState]       = useState('idle') // idle | submitting | done | error
  const [errorMsg,     setErrorMsg]    = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !body.trim()) {
      setErrorMsg('Please fill in your nickname and your story.')
      return
    }
    const beforeErr = validateImage(beforeFile)
    if (beforeErr) { setErrorMsg(`Before photo: ${beforeErr}`); return }
    const afterErr = validateImage(afterFile)
    if (afterErr) { setErrorMsg(`After photo: ${afterErr}`); return }

    setErrorMsg('')
    setState('submitting')
    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('body', body.trim())
    if (beforeFile) formData.append('before_image', beforeFile)
    if (afterFile) formData.append('after_image', afterFile)

    try {
      await axios.post(`/api/courses/${slug}/comments/`, formData, {
        headers: { 'X-Course-Session': sessionKey },
      })
      setState('done')
    } catch {
      setState('error')
      setErrorMsg('Something went wrong. Please try again.')
    }
  }

  if (state === 'done') {
    return (
      <p style={{ fontFamily: 'var(--sans)', fontSize: '0.8rem', color: '#5fbf5f', margin: 0 }}>
        ✓ Thanks — Maame Ama will review it shortly.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem' }}>
      <input
        type="text"
        placeholder="Your nickname"
        value={name}
        onChange={e => setName(e.target.value)}
        style={inputStyle}
      />
      <textarea
        placeholder="Share your story with this course…"
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={3}
        style={{ ...inputStyle, resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: '0.6rem' }}>
        <label style={{ flex: 1, fontFamily: 'var(--sans)', fontSize: '0.68rem', color: 'var(--taupe-mut)' }}>
          Before photo (optional)
          <input
            type="file"
            accept="image/*"
            onChange={e => setBeforeFile(e.target.files?.[0] || null)}
            style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.75rem', color: 'var(--taupe)' }}
          />
        </label>
        <label style={{ flex: 1, fontFamily: 'var(--sans)', fontSize: '0.68rem', color: 'var(--taupe-mut)' }}>
          After photo (optional)
          <input
            type="file"
            accept="image/*"
            onChange={e => setAfterFile(e.target.files?.[0] || null)}
            style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.75rem', color: 'var(--taupe)' }}
          />
        </label>
      </div>

      {errorMsg && (
        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.75rem', color: 'rgba(255,120,120,0.9)', margin: 0 }}>{errorMsg}</p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="btn btn-gold"
          style={{ fontSize: '0.62rem', padding: '0.6rem 1rem', opacity: state === 'submitting' ? 0.6 : 1 }}
        >
          {state === 'submitting' ? 'Submitting…' : 'Submit Story'}
        </button>
        <button
          type="button"
          onClick={onDone}
          style={{ background: 'none', border: '1px solid var(--hair)', color: 'var(--taupe-mut)', fontFamily: 'var(--sans)', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.6rem 1rem', borderRadius: '9999px', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
