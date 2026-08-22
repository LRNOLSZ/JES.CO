import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import axios from 'axios'
import { CourseSessionProvider } from './context/CourseSessionContext'
import { CartProvider } from './context/CartContext'
import { RegionProvider } from './context/RegionContext'
import './index.css'
import App from './App.jsx'

// All relative axios calls (e.g. axios.get('/api/...')) resolve against this.
// In dev, straight to the local Django server. In production, left empty so
// calls stay same-origin — Vercel's rewrites (frontend/vercel.json) silently
// proxy /api/* to Railway server-to-server, so the browser never sees the
// Railway hostname directly.
axios.defaults.baseURL = import.meta.env.DEV ? 'http://localhost:8000' : ''

// index.html has a static <title>/<meta name="description"> fallback, for
// crawlers that never run this JS at all. Anything that DOES run this file
// gets react-helmet-async's per-route version instead — but Helmet only
// manages tags it renders itself, it won't remove the static ones. Strip
// them here, before Helmet ever mounts, so JS-capable visitors never end up
// with two <title>/description tags (which happened once already — see
// CLAUDE.md changelog / discoverability_seo memory, 2026-08-10).
document.querySelector('title')?.remove()
document.querySelector('meta[name="description"]')?.remove()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <CourseSessionProvider>
          <RegionProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </RegionProvider>
        </CourseSessionProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
