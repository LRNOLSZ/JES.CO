import { Routes, Route } from 'react-router-dom'

import Navbar               from './components/Navbar'
import Footer               from './components/Footer'
import JescoNavbar          from './components/JescoNavbar'
import JescoFooter          from './components/JescoFooter'
import StudioHero           from './components/Hero'
import StudioSection        from './components/StudioSection'
import WorkSection          from './components/BeforeAfterSlider'
import ServicesSection      from './components/ServicesSection'
import CoursesSection       from './components/CoursesSection'
import TestimonialsSection  from './components/TestimonialsSection'
import BookingSection       from './components/BookingSection'
import StudioVideoSection  from './components/StudioVideoSection'
import GalleryPage          from './pages/GalleryPage'
import JescoHomePage        from './pages/JescoHomePage'
import ProductLinePage      from './pages/ProductLinePage'
import CoursesPage          from './pages/CoursesPage'
import CourseDetailPage     from './pages/CourseDetailPage'
import CourseAccessPage        from './pages/CourseAccessPage'
import CourseAccessVerifyPage  from './pages/CourseAccessVerifyPage'
import CoursesDashboardPage    from './pages/CoursesDashboardPage'
import CartPage                from './pages/CartPage'
import OrderTrackingPage       from './pages/OrderTrackingPage'

const STUDIO_WORDS = ['Bridal Glam', 'Editorial', 'Corrective Skin', 'Transformation', 'Training', 'Photoshoot']

function StudioMarquee() {
  const items = [...STUDIO_WORDS, ...STUDIO_WORDS]
  return (
    <div style={{ overflow: 'hidden', borderTop: '1px solid var(--hair)', borderBottom: '1px solid var(--hair)', background: 'var(--ink-2)', padding: '0.85rem 0' }}>
      <div style={{ display: 'flex', gap: '3.5rem', width: 'max-content', animation: 'marquee 22s linear infinite' }}>
        {items.map((w, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '3.5rem', whiteSpace: 'nowrap', fontFamily: 'var(--sans)', fontSize: '0.62rem', letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--taupe)' }}>
            {w}
            <span style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--champ)', flexShrink: 0 }} />
          </span>
        ))}
      </div>
    </div>
  )
}

function StudioHomePage() {
  return (
    <>
      <JescoNavbar />
      <main style={{ width: '100%' }}>
        <StudioHero />
        <StudioMarquee />
        <StudioVideoSection />
        <StudioSection />
        <WorkSection />
        <ServicesSection />
        <CoursesSection />
        <TestimonialsSection />
        <BookingSection />
      </main>
      <JescoFooter />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/"                    element={<JescoHomePage />} />
      <Route path="/studio"              element={<StudioHomePage />} />
      <Route path="/studio/gallery"       element={<GalleryPage />} />
      <Route path="/studio/courses"       element={<CoursesPage />} />
      <Route path="/studio/courses/:slug" element={<CourseDetailPage />} />
      <Route path="/products/:category"              element={<ProductLinePage />} />
      <Route path="/studio/courses/access"           element={<CourseAccessPage />} />
      <Route path="/studio/courses/access/verify"    element={<CourseAccessVerifyPage />} />
      <Route path="/studio/courses/dashboard"        element={<CoursesDashboardPage />} />
      <Route path="/cart"                            element={<CartPage />} />
      <Route path="/track-order"                    element={<OrderTrackingPage />} />
    </Routes>
  )
}
