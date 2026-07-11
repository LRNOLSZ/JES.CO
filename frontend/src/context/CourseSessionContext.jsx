import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

const CourseSessionContext = createContext(null)

export function CourseSessionProvider({ children }) {
  const [sessionEmail, setSessionEmail] = useState(null)
  const [purchases,    setPurchases]    = useState([])
  const [isLoading,    setIsLoading]    = useState(true)

  const sessionKey = localStorage.getItem('jes_course_session')

  function fetchDashboard() {
    if (!sessionKey) return Promise.resolve()
    return axios.get('/api/courses/dashboard/', {
      headers: { 'X-Course-Session': sessionKey },
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
