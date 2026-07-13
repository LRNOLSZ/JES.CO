import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

const CourseSessionContext = createContext(null)

export function CourseSessionProvider({ children }) {
  const [sessionEmail, setSessionEmail] = useState(null)
  const [purchases,    setPurchases]    = useState([])
  const [isLoading,    setIsLoading]    = useState(true)

  const sessionKey = localStorage.getItem('jes_course_session')

  function fetchDashboard() {
    // Read fresh from localStorage rather than closing over the outer `sessionKey` —
    // this function is exposed as `refreshPurchases` and gets called right after other
    // pages (e.g. the magic-link verify page) write a brand new session key; a stale
    // closure would still see the old (often empty) key and silently no-op.
    const key = localStorage.getItem('jes_course_session')
    if (!key) return Promise.resolve()
    return axios.get('/api/courses/dashboard/', {
      headers: { 'X-Course-Session': key },
    })
      .then(r => {
        setSessionEmail(r.data.email)
        setPurchases(r.data.courses || [])
      })
      .catch(() => {
        localStorage.removeItem('jes_course_session')
      })
  }

  useEffect(() => {
    if (!sessionKey) {
      setIsLoading(false)
      return
    }
    fetchDashboard().finally(() => setIsLoading(false))
  }, [sessionKey])

  function clearSession() {
    const key = localStorage.getItem('jes_course_session')
    if (key) {
      axios.delete('/api/courses/access/session/', {
        headers: { 'X-Course-Session': key },
      }).catch(() => {})
      localStorage.removeItem('jes_course_session')
    }
    setSessionEmail(null)
    setPurchases([])
  }

  return (
    <CourseSessionContext.Provider value={{ sessionEmail, purchases, isLoading, clearSession, refreshPurchases: fetchDashboard }}>
      {children}
    </CourseSessionContext.Provider>
  )
}

export function useCourseSession() {
  return useContext(CourseSessionContext)
}
