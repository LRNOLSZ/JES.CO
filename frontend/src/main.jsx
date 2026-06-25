import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CourseSessionProvider } from './context/CourseSessionContext'
import { CartProvider } from './context/CartContext'
import './index.css'
import App from './App.jsx'

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
