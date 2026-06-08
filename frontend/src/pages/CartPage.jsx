import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import JescoNavbar from '../components/JescoNavbar'
import JescoFooter from '../components/JescoFooter'
import { useCart } from '../context/CartContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 24 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
})

export default function CartPage() {
  const { cart, removeFromCart, updateQty, clearCart, cartCount } = useCart()

  const [form, setForm]     = useState({ full_name: '', email: '', phone: '', address: '', notes: '' })
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (cart.length === 0) return
    setStatus('loading')

    const payload = {
      ...form,
      total: `GHS ${cart.reduce((sum, i) => {
        const num = parseFloat((i.price || '0').replace(/[^\d.]/g, '')) || 0
        return sum + num * i.quantity
      }, 0).toFixed(2)}`,
      items: cart.map(i => ({
        product_id: i.id,
        name:       i.name,
        price:      i.price || '',
        quantity:   i.quantity,
      })),
    }

    try {
      const { data } = await axios.post(`${API_BASE}/api/products/orders/`, payload)
      setStatus('success')
      clearCart()
      if (data.whatsapp_url) {
        window.open(data.whatsapp_url, '_blank')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again.')
    }
  }

  const inputStyle = {
    width:         '100%',
    padding:       '0.8rem 1rem',
    borderRadius:  '8px',
    border:        '1px solid rgba(212,175,55,0.2)',
    background:    'rgba(255,255,255,0.04)',
    color:         '#fff',
    fontFamily:    "'DM Sans', sans-serif",
    fontSize:      '0.88rem',
    outline:       'none',
    boxSizing:     'border-box',
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: 'var(--dark-base)', color: 'var(--text-primary)' }}>
      <JescoNavbar />

      <section style={{
        padding:   'clamp(7rem, 14vw, 10rem) 1.5rem clamp(4rem, 8vw, 7rem)',
        maxWidth:  '900px',
        margin:    '0 auto',
      }}>

        {/* Header */}
        <motion.div {...fadeUp()} style={{ marginBottom: '3rem' }}>
          <Link to="/#products" style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.62rem',
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--text-muted)', textDecoration: 'none',
            display: 'inline-block', marginBottom: '1.5rem',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ← Continue Shopping
          </Link>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#fff', marginBottom: '0.5rem' }}>
            Your Cart
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {cartCount === 0 ? 'Your cart is empty.' : `${cartCount} item${cartCount > 1 ? 's' : ''}`}
          </p>
        </motion.div>

        {status === 'success' ? (
          <motion.div {...fadeUp()} style={{
            textAlign: 'center', padding: '4rem 2rem',
            border: '1px solid rgba(212,175,55,0.3)', borderRadius: '16px',
            background: 'rgba(212,175,55,0.04)',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✦</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', color: '#fff', marginBottom: '0.75rem' }}>
              Order Received
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '2rem' }}>
              Your order has been sent. WhatsApp should have opened — if not, Maame Ama will be in touch via email.
            </p>
            <Link to="/" style={{
              padding: '0.8rem 2rem', borderRadius: '9999px',
              background: 'linear-gradient(135deg, var(--gold-light), var(--gold))',
              color: '#0C0A14', fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase',
              fontWeight: 700, textDecoration: 'none',
            }}>
              Back to JES.CO
            </Link>
          </motion.div>
        ) : cartCount === 0 ? (
          <motion.div {...fadeUp(0.1)} style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Browse our collections and add items to your cart.
            </p>
            <Link to="/#products" style={{
              padding: '0.8rem 2rem', borderRadius: '9999px',
              border: '1px solid var(--gold)', color: 'var(--gold)',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem',
              letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none',
            }}>
              Shop Now
            </Link>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>

            {/* Cart items */}
            <motion.div {...fadeUp(0.1)}>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1.25rem' }}>
                Items
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cart.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', gap: '1rem', alignItems: 'center',
                    padding: '1rem', borderRadius: '12px',
                    border: '1px solid rgba(212,175,55,0.15)',
                    background: 'rgba(255,255,255,0.02)',
                  }}>
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.95rem', color: '#fff', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: 'var(--gold)' }}>{item.price}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#fff', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,100,100,0.5)', cursor: 'pointer', fontSize: '1rem', marginLeft: '0.25rem' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Checkout form */}
            <motion.div {...fadeUp(0.2)}>
              <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.65rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1.25rem' }}>
                Your Details
              </h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {[
                  { name: 'full_name', placeholder: 'Full Name *',    required: true  },
                  { name: 'email',     placeholder: 'Email Address *', required: true  },
                  { name: 'phone',     placeholder: 'Phone / WhatsApp *', required: true },
                  { name: 'address',   placeholder: 'Delivery Address (optional)', required: false },
                  { name: 'notes',     placeholder: 'Notes (optional)', required: false },
                ].map(f => (
                  <input
                    key={f.name}
                    type={f.name === 'email' ? 'email' : 'text'}
                    name={f.name}
                    placeholder={f.placeholder}
                    required={f.required}
                    value={form[f.name]}
                    onChange={handleChange}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)' }}
                    onBlur={e =>  { e.target.style.borderColor = 'rgba(212,175,55,0.2)'; e.target.style.boxShadow = 'none' }}
                  />
                ))}

                {errorMsg && (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: 'rgba(255,120,120,0.85)' }}>{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  style={{
                    padding: '0.9rem', borderRadius: '9999px',
                    background: 'linear-gradient(135deg, var(--gold-light), var(--gold))',
                    color: '#0C0A14', border: 'none',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem',
                    letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700,
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    opacity: status === 'loading' ? 0.7 : 1,
                    marginTop: '0.5rem',
                  }}
                >
                  {status === 'loading' ? 'Placing Order…' : 'Place Order via WhatsApp →'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </section>

      <JescoFooter />
    </div>
  )
}
