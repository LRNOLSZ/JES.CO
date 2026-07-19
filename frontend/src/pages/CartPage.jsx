import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'
import { useCart } from '../context/CartContext'
import { useRegion } from '../context/RegionContext'
import { formatPrice } from '../utils/price'

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
  const { region } = useRegion()

  const [form,         setForm]         = useState({ full_name: '', email: '', phone: '', address: '', notes: '' })
  const [zones,        setZones]        = useState({ ghana: [], usa: [] })
  const [selectedZone, setSelectedZone] = useState(null)
  const [status,       setStatus]       = useState('idle')  // idle | loading | success | error
  const [errorMsg,     setErrorMsg]     = useState('')
  const [trackingRef,   setTrackingRef]   = useState('')
  const [trackingEmail, setTrackingEmail] = useState('')

  const currency  = region === 'usa' ? 'USD' : 'GHS'
  const itemPrice = (item) => formatPrice((region === 'usa' && item.price_usd) ? item.price_usd : item.price, currency)

  const subtotal    = cart.reduce((sum, i) => sum + parsePrice(itemPrice(i)) * i.quantity, 0)
  const deliveryFee = selectedZone ? parseFloat(selectedZone.price) : 0
  const total       = subtotal + deliveryFee

  // Reset the chosen delivery zone if it no longer matches the active region
  useEffect(() => {
    setSelectedZone(prev => (prev && prev.country === region) ? prev : null)
  }, [region])

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

  async function checkStock() {
    try {
      const { data } = await axios.get('/api/products/')
      const byId = Object.fromEntries(data.map(p => [p.id, p]))
      const shortages = cart.filter(i => {
        const p = byId[i.id]
        return p && p.quantity != null && i.quantity > p.quantity
      })
      if (shortages.length) {
        return `Not enough stock for: ${shortages.map(i => i.name).join(', ')}. Please adjust your cart.`
      }
      return null
    } catch {
      return null // fail open — don't block checkout on a network hiccup
    }
  }

  // WhatsApp-only: sends the order details to Maame Ama and opens WhatsApp — no
  // Order is created here since nothing is verified yet. She completes the real
  // order via Paystack checkout herself once she's received payment.
  async function sendWhatsAppRequest() {
    const payload = {
      ...form,
      total:               `${currency} ${total.toFixed(2)}`,
      delivery_zone_id:    selectedZone?.id || null,
      delivery_fee:        deliveryFee,
      items: cart.map(i => ({ product_id: i.id, name: i.name, price: itemPrice(i) || '', quantity: i.quantity })),
    }
    try {
      const { data } = await axios.post('/api/products/orders/', payload)
      setStatus('sent')
      clearCart()
      if (data.whatsapp_url) {
        window.open(data.whatsapp_url, '_blank')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again.')
    }
  }

  async function handlePaystack() {
    if (!PAYSTACK_KEY || !window.PaystackPop) {
      setErrorMsg('Payment not available yet. Please use WhatsApp order.')
      return
    }
    if (!isFormValid()) {
      setErrorMsg('Please fill in your name, email, phone and select a delivery zone.')
      return
    }
    setStatus('loading')
    const stockError = await checkStock()
    if (stockError) {
      setStatus('idle')
      setErrorMsg(stockError)
      return
    }
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
        items: cart.map(i => ({ id: i.id, name: i.name, price: itemPrice(i), quantity: i.quantity })),
      },
      callback: (response) => {
        setTrackingRef(response.reference)
        setTrackingEmail(form.email)
        clearCart()
        setStatus('success')
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
    const stockError = await checkStock()
    if (stockError) {
      setStatus('idle')
      setErrorMsg(stockError)
      return
    }
    await sendWhatsAppRequest()
  }

  if (status === 'success' || status === 'sent') return (
    <>
      <JescoNavbar />
      <main style={{ background: 'var(--ink)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem' }}>
        <motion.div {...fadeUp()} style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem 2rem', border: '1px solid color-mix(in srgb, var(--champ) 30%, transparent)', borderRadius: '16px', background: 'color-mix(in srgb, var(--champ) 4%, transparent)' }}>
          <div className="serif ital metal-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✦</div>
          <h2 className="serif" style={{ fontSize: '1.8rem', color: 'var(--bone)', marginBottom: '0.75rem' }}>
            {status === 'sent' ? 'Request Sent' : 'Order Confirmed'}
          </h2>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '0.9rem', color: 'var(--taupe)', lineHeight: 1.7, marginBottom: '2rem' }}>
            {status === 'sent'
              ? "Your order details have been sent to Maame Ama via WhatsApp. Once she's received your payment, she'll complete your order and you'll get an automatic confirmation email with your receipt and tracking link."
              : 'Your order has been received. Check your email for your receipt and tracking link.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
            {trackingRef && (
              <Link
                to={`/track-order?ref=${encodeURIComponent(trackingRef)}&email=${encodeURIComponent(trackingEmail)}`}
                className="btn btn-gold"
              >
                Track Your Order
              </Link>
            )}
            <Link to="/" className="btn btn-ghost">Back to JES.CO</Link>
          </div>
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
                        <p style={{ fontFamily: 'var(--sans)', fontSize: '0.78rem', color: 'var(--champ)' }}>{itemPrice(item)}</p>
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

                {/* Delivery zones — only the active region's zones show, so pricing is never mixed on-screen */}
                <p style={{ fontFamily: 'var(--sans)', fontSize: '0.62rem', letterSpacing: '0.38em', textTransform: 'uppercase', color: 'var(--champ)', marginBottom: '1rem' }}>
                  Delivery Location — {region === 'usa' ? 'USA' : 'Ghana'} *
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                  {(zones[region] || []).map(zone => (
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
                  {!(zones[region] || []).length && (
                    <p style={{ fontFamily: 'var(--sans)', fontSize: '0.8rem', color: 'var(--taupe-mut)' }}>
                      No delivery zones set up yet for this region.
                    </p>
                  )}
                </div>

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
