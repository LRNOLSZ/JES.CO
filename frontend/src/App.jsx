import { Routes, Route } from 'react-router-dom'

import Navbar               from './components/Navbar'
import Hero                 from './components/Hero'
import GallerySection       from './components/GallerySection'
import StudioSection        from './components/StudioSection'
import CoursesSection       from './components/CoursesSection'
import TestimonialsSection  from './components/TestimonialsSection'
import BookingSection       from './components/BookingSection'
import Footer               from './components/Footer'
import GalleryPage          from './pages/GalleryPage'

function HomePage() {
  return (
    <>
      <Navbar />
      <main style={{ width: '100%' }}>
        <Hero />
        <GallerySection />
        <StudioSection />
        <CoursesSection />
        <TestimonialsSection />
        <BookingSection />
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/"        element={<HomePage />} />
      <Route path="/gallery" element={<GalleryPage />} />
    </Routes>
  )
}
