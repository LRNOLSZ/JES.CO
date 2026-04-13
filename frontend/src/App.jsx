import { Routes, Route } from 'react-router-dom'

import Navbar               from './components/Navbar'
import Hero                 from './components/Hero'
import GallerySection       from './components/GallerySection'
import StudioSection        from './components/StudioSection'
import CoursesSection       from './components/CoursesSection'
import TestimonialsSection  from './components/TestimonialsSection'
import StudioVideoSection   from './components/StudioVideoSection'
import BookingSection       from './components/BookingSection'
import Footer               from './components/Footer'
import GalleryPage          from './pages/GalleryPage'
import JescoHomePage        from './pages/JescoHomePage'
import ProductLinePage      from './pages/ProductLinePage'
import CoursesPage          from './pages/CoursesPage'
import CourseDetailPage     from './pages/CourseDetailPage'

function StudioHomePage() {
  return (
    <>
      <Navbar />
      <main style={{ width: '100%' }}>
        <Hero />
        <StudioVideoSection />
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
      <Route path="/"                    element={<JescoHomePage />} />
      <Route path="/studio"              element={<StudioHomePage />} />
      <Route path="/studio/gallery"       element={<GalleryPage />} />
      <Route path="/studio/courses"       element={<CoursesPage />} />
      <Route path="/studio/courses/:slug" element={<CourseDetailPage />} />
      <Route path="/products/:category"   element={<ProductLinePage />} />
    </Routes>
  )
}
