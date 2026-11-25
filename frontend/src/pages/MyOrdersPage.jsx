import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'
import SEO from '../components/SEO'
import { useShopSession } from '../context/ShopSessionContext'

// Matches products/models.py Order.STATUS_CHOICES. Colours follow the real
// brand palette (gold --champ #A8864A), not the retired purple.
const STATUS_META = {
  pending:    { color: '#6b7280', label: 'Pending',    desc: 'Received, awaiting confirmation.' },
  confirmed:  { color: '#1a56db', label: 'Confirmed',  desc: 'Confirmed and being prepared.' },
  processing: { color: '#d97706', label: 'Processing', desc: 'Being packed for dispatch.' },
  shipped:    { color: '#A8864A', label: 'Shipped',    desc: 'On its way to you.' },
  delivered:  { color: '#16a34a', label: 'Delivered',  desc: 'Delivered. Enjoy!' },
  cancelled:  { color: '#dc2626', label: 'Cancelled',  desc: 'Cancelled — get in touch with any questions.' },
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay },
})

const LABEL = {
  fontFamily: 'var(--sans)', fontSize: '0.62rem', letterSpacing: '0.38em',
  textTransform: 'uppercase', color: 'var(--champ)', marginBottom: '1.25rem',
}

const CARD = {
  padding: '1.1rem 1.2rem', borderRadius: '12px', border: '1px solid var(--hair)',
  background: 'color-mix(in srgb, var(--bone) 3%, transparent)',
}

export default function MyOrdersPage() {
  const { email, orders, downloads, isLoading, signOut } = useShopSession()

  const [inputEmail, setInputEmail] = useState('')
  const [state, setState]           = useState('idle')  // idle | loading | sent | error
  const [errorMsg, setErrorMsg]     = useState('')

  async function requestLink(e) {
    e.preventDefault()
    if (!inputEmail.trim()) return
    setState('loading')
    try {
      await axios.post('/api/shop/access/request/', {
        email: inputEmail.trim().toLowerCase(),
      })
      // Always the same outcome regardless of whether the email is known — the
      // backend deliberately doesn't say, so this page mustn't either.
      setState('sent')
    } catch (err) {
      setErrorMsg(
        err.response?.status === 429
          ? 'Too many requests — please wait a minute and try again.'
          : 'Something went wrong. Please try again.'
      )
      setState('error')
    }
  }

  return (
    <div style={{ background: 'var(--ink)', minHeight: '100vh' }}>
      <SEO
        title="My Orders & Downloads — JES.CO"
        description="Track your JES.CO orders and access your digital downloads."
      />
      <JescoNavbar overDark />

      <section className="wrap" style={{ paddingTop: '8rem', paddingBottom: '5rem', maxWidth: '760px' }}>
        <motion.div {...fadeUp()}>
          <p style={LABEL}>Your Account</p>
          <h1 className="serif" style={{ fontSize: 'clamp(1.9rem,4vw,2.8rem)', color: 'var(--bone)', marginBottom: '0.75rem' }}>
            Orders &amp; Downloads
          </h1>
        </motion.div>

        {isLoading ? (
          <p style={{ fontFamily: 'var(--sans)', fontSize: '0.85rem', color: 'var(--taupe-mut)' }}>Loading…</p>

        ) : !email ? (
          /* ── Not signed in — request a magic link ─────────────────────── */
          <motion.div {...fadeUp(0.1)} style={{ ...CARD, marginTop: '1.5rem' }}>
            {state === 'sent' ? (
              <>
                <p className="serif" style={{ fontSize: '1.15rem', color: 'var(--bone)', marginBottom: '0.5rem' }}>
                  Check your email
                </p>
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.85rem', color: 'var(--taupe)', lineHeight: 1.6 }}>
                  If this email has any orders or downloads, we've sent it a link to view them.
                  The link lasts 24 hours — request another any time.
                </p>
              </>
            ) : (
              <>
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.85rem', color: 'var(--taupe)', lineHeight: 1.6, marginBottom: '1.1rem' }}>
                  Enter the email you used at checkout and we'll send you a link to all your
                  orders and digital downloads — no password needed.
                </p>
                <form onSubmit={requestLink} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input
                    type="email"
                    required
                    value={inputEmail}
                    onChange={e => setInputEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={{
                      padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--hair)',
                      background: 'transparent', color: 'var(--bone)', fontFamily: 'var(--sans)',
                      fontSize: '0.9rem',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={state === 'loading'}
                    className="btn btn-gold"
                    style={{ justifyContent: 'center', opacity: state === 'loading' ? 0.7 : 1 }}
                  >
                    {state === 'loading' ? 'Sending…' : 'Email me my link →'}
                  </button>
                </form>
                {state === 'error' && (
                  <p style={{ fontFamily: 'var(--sans)', fontSize: '0.78rem', color: '#e8a0a0', marginTop: '0.75rem' }}>
                    {errorMsg}
                  </p>
                )}
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.75rem', color: 'var(--taupe-mut)', marginTop: '1rem' }}>
                  Have a tracking link from an order email? You can also{' '}
                  <Link to="/track-order" style={{ color: 'var(--champ)' }}>track a single order</Link>.
                </p>
              </>
            )}
          </motion.div>

        ) : (
          /* ── Signed in ────────────────────────────────────────────────── */
          <>
            <motion.div {...fadeUp(0.05)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.82rem', color: 'var(--taupe)' }}>
                Signed in as <span style={{ color: 'var(--bone)' }}>{email}</span>
              </p>
              <button
                onClick={signOut}
                style={{ background: 'none', border: '1px solid var(--hair)', borderRadius: '8px', padding: '0.4rem 0.9rem', color: 'var(--taupe)', fontFamily: 'var(--sans)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Sign out
              </button>
            </motion.div>

            {/* Downloads first — permanent, and the thing people come back for */}
            <motion.div {...fadeUp(0.1)} style={{ marginBottom: '3rem' }}>
              <p style={LABEL}>Your Downloads</p>
              {downloads.length === 0 ? (
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.85rem', color: 'var(--taupe-mut)' }}>
                  No digital products yet.{' '}
                  <Link to="/products/makeup" style={{ color: 'var(--champ)' }}>Browse the shop →</Link>
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {downloads.map(d => (
                    <div key={d.product_id} style={{ ...CARD, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 0 }}>
                        <p className="serif" style={{ fontSize: '1rem', color: 'var(--bone)' }}>{d.name}</p>
                        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.72rem', color: 'var(--taupe-mut)', marginTop: '0.15rem' }}>
                          Yours permanently — download any time
                        </p>
                      </div>
                      {d.url ? (
                        /* The link is signed and short-lived, re-minted every
                           time this page loads — so it's always fresh here, and
                           a copied URL stops working. */
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="btn btn-gold" style={{ flexShrink: 0 }}>
                          Download PDF ↓
                        </a>
                      ) : (
                        <span style={{ fontFamily: 'var(--sans)', fontSize: '0.75rem', color: '#e8a0a0', flexShrink: 0 }}>
                          File unavailable — please contact us
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Orders */}
            <motion.div {...fadeUp(0.15)}>
              <p style={LABEL}>Your Orders</p>
              {orders.length === 0 ? (
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.85rem', color: 'var(--taupe-mut)' }}>
                  No orders yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {orders.map(o => {
                    const meta = STATUS_META[o.status] || STATUS_META.pending
                    return (
                      <div key={o.id} style={CARD}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                          <p className="serif" style={{ fontSize: '1rem', color: 'var(--bone)' }}>Order #{o.id}</p>
                          <span style={{
                            fontFamily: 'var(--sans)', fontSize: '0.68rem', letterSpacing: '0.1em',
                            textTransform: 'uppercase', color: meta.color,
                            border: `1px solid ${meta.color}`, borderRadius: '999px', padding: '0.2rem 0.7rem',
                          }}>
                            {meta.label}
                          </span>
                        </div>
                        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.78rem', color: 'var(--taupe-mut)', marginBottom: '0.7rem' }}>
                          {meta.desc}
                        </p>
                        <div style={{ borderTop: '1px solid var(--hair)', paddingTop: '0.7rem' }}>
                          {o.items.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--sans)', fontSize: '0.8rem', color: 'var(--taupe)', marginBottom: '0.25rem' }}>
                              <span>{it.name} ×{it.quantity}</span>
                              <span>{it.price}</span>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--sans)', fontSize: '0.88rem', fontWeight: 600, color: 'var(--champ)', borderTop: '1px solid var(--hair)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                            <span>Total</span><span>{o.total}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </section>

      <JescoFooter />
    </div>
  )
}
