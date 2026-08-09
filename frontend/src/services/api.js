import axios from 'axios'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'

export function getApiErrorDetails(error) {
  return error?.response?.data?.details || null
}

export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  const response = error?.response
  const data = response?.data

  if (response) {
    if (response.status === 401) {
      return data?.message || 'Invalid phone number or password.'
    }
    if (response.status === 403) {
      return data?.message || 'Access denied.'
    }
    if (response.status === 404) {
      return data?.message || 'The requested information could not be found.'
    }
  }

  if (data) {
    if (typeof data === 'string' && data.trim()) {
      return data.trim()
    }
    if (data.message) {
      return data.message
    }
    if (data.error && typeof data.error === 'string') {
      return data.error
    }
    const details = data.details
    if (details && typeof details === 'object') {
      const first = Object.values(details).find((value) => Boolean(value))
      if (typeof first === 'string') {
        return first
      }
    }
  }

  if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
    return 'Unable to reach the server. Check your connection and try again.'
  }

  return fallback
}

export function showAppToast(message, type = 'error') {
  toast.dismiss('app-toast')
  if (type === 'success') {
    toast.success(message, { id: 'app-toast' })
  } else {
    toast.error(message, { id: 'app-toast' })
  }
}

const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const defaultApiBaseUrl = envApiBaseUrl
  ? `${envApiBaseUrl.replace(/\/+$|\/(?=\s*$)/, '')}/`
  : '/api/v1/'

const api = axios.create({
  baseURL: defaultApiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof config.url === 'string' && config.url.startsWith('/')) {
    config.url = config.url.slice(1)
  }
  const token = useAuthStore.getState().token
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = !!error?.config?.url?.includes('/auth/')
    const isPublicRequest = isAuthRequest || !!error?.config?.url?.includes('/health')
    const token = useAuthStore.getState().token
    const suppressErrorToast = Boolean(error?.config?.suppressErrorToast)

    if (!error.response) {
      if (!isPublicRequest) {
        showAppToast('Unable to reach the server. Please check your internet connection and try again.')
      }
      return Promise.reject(error)
    }

    const status = error.response.status
    const message = getApiErrorMessage(error, 'Something went wrong. Please try again.')
    const currentPath = window.location.pathname

    if (status === 401) {
      if (!isAuthRequest) {
        useAuthStore.getState().logout()
        if (currentPath !== '/login') {
          window.location.href = '/login'
        }
        showAppToast('Your session has expired. Please login again.')
      }
    } else if (status === 403) {
      if (!isAuthRequest) {
        if (token && currentPath !== '/unauthorized') {
          window.location.href = '/unauthorized'
          showAppToast('You do not have permission to access this section.')
        } else if (!token && currentPath !== '/login') {
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
      }
    } else if (status >= 500 && !isPublicRequest) {
      if (currentPath !== '/error') {
        window.location.href = '/error'
      }
    } else if (!isPublicRequest && !suppressErrorToast) {
      showAppToast(message)
    }

    return Promise.reject(error)
  }
)

export const unwrap = (response) => response.data.data

export default api
