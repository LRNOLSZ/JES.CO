import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'
import { useCart } from '../context/CartContext'

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 24 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
})

const inputStyle = {
  width:        '100%',
  padding:      '0.8rem 1rem',
  borderRadius: '8px',
  border:       '1px solid var(--hair)',
  background:   'color-mix(in srgb, var(--bone) 4%, transparent)',
  color:        'var(--bone)',
  fontFamily:   'var(--sans)',
  fontSize:     '0.88rem',
  outline:      'none',
  boxSizing:    'border-box',
}

function parsePrice(str) {
  if (!str) return 0
  const n = parseFloat(String(str).replace(/[^\d.]/g, ''))
  return isNaN(n) ? 0 : n
}

export default function CartPage() {
  const { cart, removeFromCart, updateQty, clearCart, cartCount } = useCart()

  const [form,         setForm]         = useState({ full_name: '', email: '', phone: '', address: '', notes: '' })
  const [zones,        setZones]        = useState({ ghana: [], usa: [] })
  const [selectedZone, setSelectedZone] = useState(null)
  const [status,       setStatus]       = useState('idle')  // idle | loading | success | error
  const [errorMsg,     setErrorMsg]     = useState('')

  const subtotal    = cart.reduce((sum, i) => sum + parsePrice(i.price) * i.quantity, 0)
  const deliveryFee = selectedZone ? parseFloat(selectedZone.price) : 0
  const total       = subtotal + deliveryFee
  const currency    = selectedZone?.country === 'usa' ? 'USD' : 'GHS'

  // Load Paystack script
  useEffect(() => {
    if (!PAYSTACK_KEY) return
    const existing = document.getElementById('paystack-js')
    if (existing) return
    const script = document.createElement('script')
    script.id    = 'paystack-js'
    script.src   = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  // Load delivery zones
  useEffect(() => {
    axios.get('/api/delivery-zones/').then(r => setZones(r.data)).catch(() => {})
  }, [])

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const formFields = [
    { name: 'full_name', placeholder: 'Full Name *',          required: true  },
    { name: 'email',     placeholder: 'Email Address *',       required: true  },
    { name: 'phone',     placeholder: 'Phone / WhatsApp *',    required: true  },
    { name: 'address',   placeholder: 'Delivery Address (optional)', required: false },
    { name: 'notes',     placeholder: 'Notes (optional)',      required: false },
  ]

  const isFormValid = () => form.full_name && form.email && form.phone && selectedZone

  async function placeOrder(paystackReference = '') {
    const payload = {
      ...form,
      total:               `${currency} ${total.toFixed(2)}`,
      delivery_zone_id:    selectedZone?.id || null,
      delivery_fee:        deliveryFee,
      paystack_reference:  paystackReference,
      items: cart.map(i => ({ product_id: i.id, name: i.name, price: i.price || '', quantity: i.quantity })),
    }
    try {
      const { data } = await axios.post('/api/products/orders/', payload)
      setStatus('success')
      clearCart()
      if (!paystackReference && data.whatsapp_url) {
        window.open(data.whatsapp_url, '_blank')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again.')
    }
  }

  function handlePaystack() {
    if (!PAYSTACK_KEY || !window.PaystackPop) {
      setErrorMsg('Payment not available yet. Please use WhatsApp order.')
      return
    }
    if (!isFormValid()) {
      setErrorMsg('Please fill in your name, email, phone and select a delivery zone.')
      return
    }
    setStatus('loading')
    const amountSmallest = Math.round(total * 100) // pesewas for GHS, cents for USD
    const handler = window.PaystackPop.setup({
      key:      PAYSTACK_KEY,
      email:    form.email,
      amount:   amountSmallest,
      currency: currency,
      metadata: {
        customer_name:    form.full_name,
        phone:            form.phone,
        address:          form.address,
        notes:            form.notes,
        delivery_zone_id: selectedZone?.id,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      },
      callback: (response) => {
        placeOrder(response.reference)
      },
      onClose: () => {
        setStatus('idle')
      },
    })
    handler.openIframe()
  }

  async function handleWhatsApp(e) {
    e.preventDefault()
    if (!isFormValid()) {
      setErrorMsg('Please fill in your name, email, phone and select a delivery zone.')
      return
    }
    setStatus('loading')
    await placeOrder('')
  }

  if (status === 'success') return (
    <>
      <JescoNavbar />
      <main style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem' }}>
        <motion.div {...fadeUp()} style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem 2rem', border: '1px solid color-mix(in srgb, var(--champ) 30%, transparent)', borderRadius: '16px', background: 'color-mix(in srgb, var(--champ) 4%, transparent)' }}>
          <div className="serif ital metal-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✦</div>
          <h2 className="serif" style={{ fontSize: '1.8rem', color: 'var(--bone)', marginBottom: '0.75rem' }}>Order Confirmed</h2>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '0.9rem', color: 'var(--taupe)', lineHeight: 1.7, marginBottom: '2rem' }}>
            Your order has been received. Check your email for your receipt and tracking link.
          </p>
          <Link to="/" className="btn btn-gold">Back to JES.CO</Link>
        </motion.div>
      </main>
      <JescoFooter />
    </>
  )

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: 'var(--ink)', color: 'var(--bone)' }}>
      <JescoNavbar />

      <section style={{ padding: 'clamp(7rem,14vw,10rem) 0 clamp(4rem,8vw,7rem)' }}>
        <div className="wrap" style={{ maxWidth: '960px' }}>

          {/* Header */}
          <motion.div {...fadeUp()} style={{ marginBottom: '3rem' }}>
            <Link to="/#products" style={{ fontFamily: 'var(--sans)', fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--taupe-mut)', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--champ)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--taupe-mut)'}
            >
              ← Continue Shopping
            </Link>
            <h1 className="serif" style={{ fontSize: 'clamp(2rem,5vw,3rem)', color: 'var(--bone)', marginBottom: '0.5rem' }}>
              Your <span className="ital metal-text">Cart</span>
            </h1>
            <p style={{ fontFamily: 'var(--sans)', fontSize: '0.85rem', color: 'var(--taupe-mut)' }}>
              {cartCount === 0 ? 'Your cart is empty.' : `${cartCount} item${cartCount > 1 ? 's' : ''}`}
            </p>
          </motion.div>

          {cartCount === 0 ? (
            <motion.div {...fadeUp(0.1)} style={{ textAlign: 'center', padding: '4rem 0' }}>
              <p style={{ fontFamily: 'var(--sans)', color: 'var(--taupe-mut)', marginBottom: '2rem' }}>
                Browse our collections and add items to your cart.
              </p>
              <Link to="/#products" className="btn btn-ghost">Shop Now</Link>
            </motion.div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '2.5rem', alignItems: 'start' }}>

              {/* Cart items */}
              <motion.div {...fadeUp(0.1)}>
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.62rem', letterSpacing: '0.38em', textTransform: 'uppercase', color: 'var(--champ)', marginBottom: '1.25rem' }}>Items</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', borderRadius: '12px', border: '1px solid var(--hair)', background: 'color-mix(in srgb, var(--bone) 3%, transparent)' }}>
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, border: '1px solid var(--hair)' }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="serif" style={{ fontSize: '0.95rem', color: 'var(--bone)', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.78rem', color: 'var(--champ)' }}>{item.price}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <button onClick={() => updateQty(item.id, item.quantity - 1)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--hair)', background: 'transparent', color: 'var(--bone)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>−</button>
                        <span style={{ fontFamily: 'var(--sans)', fontSize: '0.85rem', color: 'var(--bone)', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--hair)', background: 'transparent', color: 'var(--bone)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>+</button>
                        <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: 'rgba(200,80,80,0.5)', cursor: 'pointer', fontSize: '1rem', marginLeft: '0.25rem' }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery zones */}
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.62rem', letterSpacing: '0.38em', textTransform: 'uppercase', color: 'var(--champ)', marginBottom: '1rem' }}>Delivery Location *</p>
                {['ghana', 'usa'].map(country => {
                  const countryZones = zones[country] || []
                  if (!countryZones.length) return null
                  return (
                    <div key={country} style={{ marginBottom: '1rem' }}>
                      <p style={{ fontFamily: 'var(--sans)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--taupe)', marginBottom: '0.5rem' }}>
                        {country === 'ghana' ? 'Ghana' : 'USA'}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {countryZones.map(zone => (
                          <label key={zone.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.9rem', borderRadius: '8px', border: `1px solid ${selectedZone?.id === zone.id ? 'var(--champ)' : 'var(--hair)'}`, background: selectedZone?.id === zone.id ? 'color-mix(in srgb, var(--champ) 6%, transparent)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <input
                              type="radio"
                              name="delivery_zone"
                              value={zone.id}
                              checked={selectedZone?.id === zone.id}
                              onChange={() => setSelectedZone(zone)}
                              style={{ accentColor: 'var(--champ)' }}
                            />
                            <span style={{ flex: 1, fontFamily: 'var(--sans)', fontSize: '0.85rem', color: 'var(--bone)' }}>{zone.location_name}</span>
                            <span style={{ fontFamily: 'var(--sans)', fontSize: '0.82rem', color: 'var(--champ)', fontWeight: 600 }}>{zone.currency} {parseFloat(zone.price).toFixed(2)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Order total */}
                {selectedZone && (
                  <div style={{ marginTop: '1.25rem', padding: '1rem 1.1rem', borderRadius: '10px', border: '1px solid var(--hair)', background: 'color-mix(in srgb, var(--bone) 3%, transparent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--sans)', fontSize: '0.82rem', color: 'var(--taupe)', marginBottom: '0.4rem' }}>
                      <span>Subtotal</span><span>{currency} {subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--sans)', fontSize: '0.82rem', color: 'var(--taupe)', marginBottom: '0.75rem' }}>
                      <span>Delivery — {selectedZone.location_name}</span><span>{currency} {deliveryFee.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--sans)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--champ)', borderTop: '1px solid var(--hair)', paddingTop: '0.6rem' }}>
                      <span>Total</span><span>{currency} {total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Checkout form */}
              <motion.div {...fadeUp(0.2)}>
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.62rem', letterSpacing: '0.38em', textTransform: 'uppercase', color: 'var(--champ)', marginBottom: '1.25rem' }}>Your Details</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {formFields.map(f => (
                    <input
                      key={f.name}
                      type={f.name === 'email' ? 'email' : 'text'}
                      name={f.name}
                      placeholder={f.placeholder}
                      required={f.required}
                      value={form[f.name]}
                      onChange={handleChange}
                      style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--champ)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--champ) 12%, transparent)' }}
                      onBlur={e  => { e.target.style.borderColor = 'var(--hair)'; e.target.style.boxShadow = 'none' }}
                    />
                  ))}

                  {errorMsg && (
                    <p style={{ fontFamily: 'var(--sans)', fontSize: '0.8rem', color: 'rgba(220,80,80,0.85)', margin: 0 }}>{errorMsg}</p>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                    {/* Primary — Paystack */}
                    {PAYSTACK_KEY ? (
                      <button
                        type="button"
                        disabled={status === 'loading'}
                        onClick={handlePaystack}
                        className="btn btn-gold"
                        style={{ justifyContent: 'center', opacity: status === 'loading' ? 0.7 : 1, cursor: status === 'loading' ? 'not-allowed' : 'pointer' }}
                      >
                        {status === 'loading' ? 'Processing…' : `Pay with Paystack — ${selectedZone ? `${currency} ${total.toFixed(2)}` : 'Select delivery zone'}`}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="btn btn-gold"
                        style={{ justifyContent: 'center', opacity: 0.45, cursor: 'not-allowed' }}
                        title="Online payment coming soon"
                      >
                        Pay Online — Coming Soon ✦
                      </button>
                    )}

                    {/* Secondary — WhatsApp */}
                    <button
                      type="button"
                      disabled={status === 'loading'}
                      onClick={handleWhatsApp}
                      className="btn btn-ghost"
                      style={{ justifyContent: 'center', opacity: status === 'loading' ? 0.7 : 1 }}
                    >
                      Order via WhatsApp →
                    </button>
                  </div>

                  <p style={{ fontFamily: 'var(--sans)', fontSize: '0.72rem', color: 'var(--taupe-mut)', textAlign: 'center', marginTop: '0.25rem' }}>
                    A receipt and tracking link will be sent to your email.
                  </p>
                </div>
              </motion.div>

            </div>
          )}
        </div>
      </section>

      <JescoFooter />
    </div>
  )
}
