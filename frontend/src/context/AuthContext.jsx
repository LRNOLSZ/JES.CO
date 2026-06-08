import { createContext, useContext, useState } from 'react'
import { logout as logoutAPI } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('jes_auth_token'))
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('jes_auth_user')) } catch { return null }
  })

  const login = (authToken, userData) => {
    localStorage.setItem('jes_auth_token', authToken)
    localStorage.setItem('jes_auth_user',  JSON.stringify(userData))
    setToken(authToken)
    setUser(userData)
  }

  const logout = async () => {
    try { await logoutAPI() } catch { /* token may already be gone */ }
    localStorage.removeItem('jes_auth_token')
    localStorage.removeItem('jes_auth_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
