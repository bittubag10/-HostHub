import axios from 'axios'
import { useAuthStore } from '../store/auth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

// withCredentials is required: the backend sets the refresh token
// as an httpOnly cookie on /auth/login, and /auth/refresh reads it back.
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Every controller response is wrapped by the backend's GlobalResponseHandler
// as { timeStamp, data, error }. We unwrap `data` here so pages can work
// with plain payloads, and normalise errors to a readable message + suberrors.
let isRefreshing = false
let pendingQueue = []

const processQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  pendingQueue = []
}

api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return { ...response, data: response.data.data }
    }
    return response
  },
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const apiError = error.response?.data?.error

    // Don't try to refresh on the auth endpoints themselves
    const isAuthRoute = original?.url?.includes('/auth/')

    if (status === 401 && !original._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
        const newToken = res.data?.data?.accessToken
        useAuthStore.getState().setAccessToken(newToken)
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    const message = apiError?.message || error.message || 'Something went wrong'
    const suberrors = apiError?.suberrors || []
    return Promise.reject({ message, suberrors, status, raw: error })
  }
)

export default api
