import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'
import SEO from '../components/SEO'

const STATUS_META = {
  pending:    { color: '#6b7280', label: 'Pending',    desc: 'Your order has been received and is awaiting confirmation.' },
  confirmed:  { color: '#1a56db', label: 'Confirmed',  desc: 'Your order is confirmed and being prepared.' },
  processing: { color: '#d97706', label: 'Processing', desc: 'Your order is being packed and prepared for dispatch.' },
  shipped:    { color: '#60269E', label: 'Shipped',    desc: 'Your order is on its way to you.' },
  delivered:  { color: '#16a34a', label: 'Delivered',  desc: 'Your order has been delivered. Enjoy!' },
  cancelled:  { color: '#dc2626', label: 'Cancelled',  desc: 'This order has been cancelled. Contact us if you have questions.' },
}

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

export default function OrderTrackingPage() {
  const [searchParams] = useSearchParams()
  const [ref,    setRef]    = useState(searchParams.get('ref') || '')
  const [email,  setEmail]  = useState(searchParams.get('email') || '')
  const [order,  setOrder]  = useState(null)
  const [state,  setState]  = useState('idle')  // idle | loading | found | not_found | error

  async function lookup(refValue, emailValue) {
    if (!refValue.trim() || !emailValue.trim()) return
    setState('loading')
    try {
      const { data } = await axios.get(`/api/orders/track/?ref=${encodeURIComponent(refValue.trim())}&email=${encodeURIComponent(emailValue.trim().toLowerCase())}`)
      setOrder(data)
      setState('found')
    } catch (err) {
      if (err.response?.status === 404) setState('not_found')
      else setState('error')
    }
  }

  useEffect(() => {
    const refParam   = searchParams.get('ref')
    const emailParam = searchParams.get('email')
    if (refParam) setRef(refParam)
    if (emailParam) setEmail(emailParam)
    if (refParam && emailParam) lookup(refParam, emailParam)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    lookup(ref, email)
  }

  const inputStyle = {
    width: '100%', padding: '0.85rem 1.1rem', borderRadius: '10px',
    border: '1px solid var(--hair)',
    background: 'color-mix(in srgb, var(--bone) 5%, transparent)',
    color: 'var(--bone)', fontFamily: 'var(--sans)', fontSize: '0.9rem',
    outline: 'none', boxSizing: 'border-box',
  }

  const meta    = order ? (STATUS_META[order.status] || STATUS_META.pending) : null
  const stepIdx = order ? STEPS.indexOf(order.status) : -1

  return (
    <>
      <SEO title="Track Your Order — JES.CO" />
      <JescoNavbar />
      <main style={{ background: 'var(--ink)', minHeight: '100vh', paddingTop: '6rem', paddingBottom: 'clamp(4rem,8vw,6rem)' }}>
        <div className="wrap" style={{ maxWidth: '580px' }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ marginBottom: '2.5rem' }}>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--champ)', marginBottom: '0.6rem' }}>
              Order Tracking
            </p>
            <h1 className="serif" style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', color: 'var(--bone)', lineHeight: 1.2, margin: 0 }}>
              Track Your Order
            </h1>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '0.88rem', fontWeight: 300, color: 'var(--taupe)', marginTop: '0.6rem', lineHeight: 1.7 }}>
              Enter the order reference from your confirmation email and the email you used at checkout.
            </p>
          </motion.div>

          {/* Lookup form */}
          <motion.form
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}
          >
            <input
              type="text"
              placeholder="Order reference (e.g. PAY_xxxxxx or order #)"
              value={ref}
              onChange={e => { setRef(e.target.value); setState('idle') }}
              required
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--champ)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--champ) 12%, transparent)' }}
              onBlur={e  => { e.target.style.borderColor = 'var(--hair)'; e.target.style.boxShadow = 'none' }}
            />
            <input
              type="email"
              placeholder="Email used at checkout"
              value={email}
              onChange={e => { setEmail(e.target.value); setState('idle') }}
              required
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--champ)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--champ) 12%, transparent)' }}
              onBlur={e  => { e.target.style.borderColor = 'var(--hair)'; e.target.style.boxShadow = 'none' }}
            />
            <button
              type="submit"
              disabled={state === 'loading'}
              className="btn btn-gold"
              style={{ justifyContent: 'center', opacity: state === 'loading' ? 0.7 : 1 }}
            >
              {state === 'loading' ? 'Looking up…' : 'Track Order →'}
            </button>
          </motion.form>

          {/* Results */}
          {state === 'not_found' && (
            <p style={{ fontFamily: 'var(--sans)', fontSize: '0.88rem', color: 'rgba(220,80,80,0.85)', padding: '1rem', border: '1px solid rgba(220,80,80,0.3)', borderRadius: '10px' }}>
              No order found. Double-check your reference and email — both must match exactly.
            </p>
          )}

          {state === 'error' && (
            <p style={{ fontFamily: 'var(--sans)', fontSize: '0.88rem', color: 'rgba(220,80,80,0.85)' }}>
              Something went wrong. Please try again.
            </p>
          )}

          {state === 'found' && order && meta && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

              {/* Status header */}
              <div style={{ padding: '1.5rem', borderRadius: '14px', border: `1px solid ${meta.color}40`, background: `color-mix(in srgb, ${meta.color} 6%, transparent)`, marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fff', background: meta.color, padding: '0.2rem 0.7rem', borderRadius: '9999px', fontWeight: 600 }}>
                    {meta.label}
                  </span>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: '0.75rem', color: 'var(--taupe-mut)' }}>Order #{order.id}</span>
                </div>
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.87rem', color: 'var(--taupe)', lineHeight: 1.6, margin: 0 }}>{meta.desc}</p>
              </div>

              {/* Progress bar */}
              {order.status !== 'cancelled' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                  {STEPS.map((step, i) => {
                    const done    = i <= stepIdx
                    const current = i === stepIdx
                    const sm      = STATUS_META[step]
                    return (
                      <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', minWidth: '60px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: done ? sm.color : 'var(--hair)', border: current ? `2px solid ${sm.color}` : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s' }}>
                            {done && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <span style={{ fontFamily: 'var(--sans)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: done ? sm.color : 'var(--taupe-mut)', textAlign: 'center', whiteSpace: 'nowrap' }}>{sm.label}</span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div style={{ flex: 1, height: '2px', background: i < stepIdx ? STATUS_META[STEPS[i + 1]]?.color || 'var(--champ)' : 'var(--hair)', margin: '0 0.25rem', marginBottom: '1.4rem', transition: 'background 0.3s' }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Order items */}
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--champ)', marginBottom: '0.75rem' }}>Items Ordered</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--sans)', fontSize: '0.85rem', color: 'var(--taupe)', padding: '0.5rem 0', borderBottom: '1px solid var(--hair)' }}>
                      <span>{item.name} <span style={{ color: 'var(--taupe-mut)' }}>×{item.quantity}</span></span>
                      <span style={{ color: 'var(--bone)' }}>{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery + total */}
              <div style={{ padding: '1rem 1.1rem', borderRadius: '10px', border: '1px solid var(--hair)', background: 'color-mix(in srgb, var(--bone) 3%, transparent)' }}>
                {order.delivery_zone && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--sans)', fontSize: '0.82rem', color: 'var(--taupe)', marginBottom: '0.4rem' }}>
                    <span>Delivery — {order.delivery_zone.location_name}</span>
                    <span>{order.delivery_zone.currency} {parseFloat(order.delivery_fee).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--sans)', fontSize: '1rem', fontWeight: 600, color: 'var(--champ)', borderTop: order.delivery_zone ? '1px solid var(--hair)' : 'none', paddingTop: order.delivery_zone ? '0.6rem' : 0 }}>
                  <span>Total Paid</span>
                  <span>{order.total}</span>
                </div>
                {order.amount_usd && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontFamily: 'var(--sans)', fontSize: '0.75rem', color: 'var(--taupe-mut)', marginTop: '0.3rem' }}>
                    <span>≈ ${parseFloat(order.amount_usd).toFixed(2)} USD</span>
                  </div>
                )}
              </div>

              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.75rem', color: 'var(--taupe-mut)', marginTop: '1.5rem', textAlign: 'center' }}>
                Questions? <a href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || ''}?text=${encodeURIComponent(`Hi, I have a question about Order #${order.id}`)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--champ)', textDecoration: 'none' }}>Contact us on WhatsApp</a>
              </p>
            </motion.div>
          )}

          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <Link to="/" style={{ fontFamily: 'var(--sans)', fontSize: '0.72rem', color: 'var(--taupe-mut)', textDecoration: 'none', letterSpacing: '0.1em' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--champ)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--taupe-mut)'}
            >
              ← Back to JES.CO
            </Link>
          </div>
        </div>
      </main>
      <JescoFooter />
    </>
  )
}
