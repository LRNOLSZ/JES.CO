import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

// Attach auth token to every request if present
API.interceptors.request.use(config => {
  const token = localStorage.getItem('jes_auth_token')
  if (token) config.headers.Authorization = `Token ${token}`
  return config
})

export const requestMagicLink = (email) =>
  API.post('/api/accounts/auth/request/', { email })

export const verifyMagicLink = (token) =>
  API.get(`/api/accounts/auth/verify/?token=${token}`)

export const logout = () =>
  API.post('/api/accounts/auth/logout/')

export default API
