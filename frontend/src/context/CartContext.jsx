import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'jes_cart'

function loadCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}

function saveCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart)

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      const updated = existing
        ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...product, quantity: 1 }]
      saveCart(updated)
      return updated
    })
  }

  const removeFromCart = (id) => {
    setCart(prev => {
      const updated = prev.filter(i => i.id !== id)
      saveCart(updated)
      return updated
    })
  }

  const updateQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id)
    setCart(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, quantity: qty } : i)
      saveCart(updated)
      return updated
    })
  }

  const clearCart = () => {
    localStorage.removeItem(STORAGE_KEY)
    setCart([])
  }

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
