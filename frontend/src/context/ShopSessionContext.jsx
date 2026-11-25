import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

const ShopSessionContext = createContext(null)

const STORAGE_KEY = 'jes_shop_session'

/**
 * Session for the customer account page (/my-orders) — physical orders and
 * digital downloads.
 *
 * Deliberately separate from CourseSessionContext: course access is its own
 * thing, with its own 8-hour/2-device limits that exist to stop video sharing.
 * Those rules make no sense for reading your own order history, so shop
 * sessions are long-lived and uncapped (see ShopSession in products/models.py).
 */
export function ShopSessionProvider({ children }) {
  const [email,     setEmail]     = useState(null)
  const [orders,    setOrders]    = useState([])
  const [downloads, setDownloads] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const sessionKey = localStorage.getItem(STORAGE_KEY)

  function fetchAccount() {
    // Read localStorage fresh rather than closing over `sessionKey` above.
    // This function is handed out as `refresh` and gets called immediately
    // after the verify page writes a brand-new key — a stale closure would
    // still see the old (usually absent) key and silently do nothing. Same
    // trap already documented and fixed once in CourseSessionContext.
    const key = localStorage.getItem(STORAGE_KEY)
    if (!key) return Promise.resolve()
    return axios.get('/api/shop/account/', { headers: { 'X-Shop-Session': key } })
      .then(r => {
        setEmail(r.data.email)
        setOrders(r.data.orders || [])
        setDownloads(r.data.downloads || [])
      })
      .catch(() => {
        // Expired or revoked — drop it so the page falls back to the email form
        // rather than sitting in a broken signed-in state.
        localStorage.removeItem(STORAGE_KEY)
        setEmail(null)
        setOrders([])
        setDownloads([])
      })
  }

  useEffect(() => {
    if (!sessionKey) {
      setIsLoading(false)
      return
    }
    fetchAccount().finally(() => setIsLoading(false))
  }, [sessionKey])

  function signOut() {
    const key = localStorage.getItem(STORAGE_KEY)
    if (key) {
      axios.delete('/api/shop/access/session/', {
        headers: { 'X-Shop-Session': key },
      }).catch(() => {})
      localStorage.removeItem(STORAGE_KEY)
    }
    setEmail(null)
    setOrders([])
    setDownloads([])
  }

  return (
    <ShopSessionContext.Provider
      value={{ email, orders, downloads, isLoading, signOut, refresh: fetchAccount }}
    >
      {children}
    </ShopSessionContext.Provider>
  )
}

export function useShopSession() {
  return useContext(ShopSessionContext)
}

export const SHOP_SESSION_KEY = STORAGE_KEY
