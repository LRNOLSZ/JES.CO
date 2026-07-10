import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import { CourseSessionProvider } from './context/CourseSessionContext'
import { CartProvider } from './context/CartContext'
import './index.css'
import App from './App.jsx'

// All relative axios calls (e.g. axios.get('/api/...')) resolve against this.
// Vite's dev proxy handles '/api' locally; in production there's no proxy, so
// this must point at the real backend via VITE_API_URL (set in Vercel env vars).
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CourseSessionProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </CourseSessionProvider>
    </BrowserRouter>
  </StrictMode>,
)
