import { Routes, Route } from 'react-router-dom'

import ScrollToTop           from './components/ScrollToTop'
import Navbar               from './components/Navbar'
import Footer               from './components/Footer'
import JescoNavbar          from './components/JescoNavbar'
import JescoFooter          from './components/JescoFooter'
import StudioHero           from './components/Hero'
import StudioSection        from './components/StudioSection'
import WorkSection          from './components/BeforeAfterSlider'
import ServicesSection      from './components/ServicesSection'
import CoursesSection       from './components/CoursesSection'
import EventsSection        from './components/EventsSection'
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
import TestimonialsPage        from './pages/TestimonialsPage'
import SkinAnalysisPage        from './pages/SkinAnalysisPage'
import AnnouncementPopup       from './components/AnnouncementPopup'
import SEO                     from './components/SEO'

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

// TODO: swap jes-co.vercel.app for the real jes.co domain once purchased.
// No `address`/`telephone` — no real street address exists yet and
// WHATSAPP_NUMBER is still a dev placeholder (see CLAUDE.md Post-Launch
// Reminders); shipping either as real structured data would be inaccurate.
const JESRES_GLAM_STUDIO_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'BeautySalon',
  name: 'Jesres Glam Studio',
  url: 'https://jes-co.vercel.app/studio',
  image: 'https://jes-co.vercel.app/og-image.png',
  description: 'Professional makeup artistry, courses, and bookings from Jesres Glam Studio — bridal, editorial, and full glam makeup.',
  areaServed: [
    { '@type': 'City', name: 'Accra', containedInPlace: { '@type': 'Country', name: 'Ghana' } },
    { '@type': 'City', name: 'Kumasi', containedInPlace: { '@type': 'Country', name: 'Ghana' } },
    { '@type': 'City', name: 'Denver', containedInPlace: { '@type': 'State', name: 'Colorado' } },
  ],
}

function StudioHomePage() {
  return (
    <>
      <SEO
        title="Jesres Glam Studio — Bridal, Editorial & Full Glam Makeup | JES.CO"
        description="Professional makeup artistry, courses, and bookings from Jesres Glam Studio — bridal, editorial, and full glam makeup in Accra, Kumasi, and Denver."
        jsonLd={JESRES_GLAM_STUDIO_JSONLD}
      />
      <JescoNavbar />
      <main style={{ width: '100%' }}>
        <StudioHero />
        <StudioMarquee />
        <StudioVideoSection />
        <StudioSection />
        <WorkSection />
        <ServicesSection />
        <CoursesSection />
        <EventsSection />
        <TestimonialsSection />
        <BookingSection />
      </main>
      <JescoFooter />
    </>
  )
}

export default function App() {
  return (
    <>
    <ScrollToTop />
    <AnnouncementPopup />
    <Routes>
      <Route path="/"                    element={<JescoHomePage />} />
      <Route path="/studio"              element={<StudioHomePage />} />
      <Route path="/studio/gallery"       element={<GalleryPage />} />
      <Route path="/studio/testimonials"  element={<TestimonialsPage />} />
      <Route path="/studio/skin-analysis" element={<SkinAnalysisPage />} />
      <Route path="/studio/courses"       element={<CoursesPage />} />
      <Route path="/studio/courses/:slug" element={<CourseDetailPage />} />
      <Route path="/products/:category"              element={<ProductLinePage />} />
      <Route path="/studio/courses/access"           element={<CourseAccessPage />} />
      <Route path="/studio/courses/access/verify"    element={<CourseAccessVerifyPage />} />
      <Route path="/studio/courses/dashboard"        element={<CoursesDashboardPage />} />
      <Route path="/cart"                            element={<CartPage />} />
      <Route path="/track-order"                    element={<OrderTrackingPage />} />
    </Routes>
    </>
  )
}
