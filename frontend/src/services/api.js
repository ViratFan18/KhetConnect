import axios from 'axios'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'

export function getApiErrorCode(error) {
  const response = error?.response
  const data = response?.data ?? error?.data
  return data?.error || null
}

export function normalizeRequestError(error) {
  const response = error?.response
  const data = response?.data ?? error?.data
  const status = response?.status ?? 0
  const errorCode = data?.error

  const isNetworkError =
    !response ||
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ECONNABORTED' ||
    error?.code === 'ETIMEDOUT' ||
    error?.message === 'Network Error' ||
    /timeout|network error|failed to fetch/i.test(error?.message || '')

  const toFriendlyMessage = (rawMessage) => {
    if (!rawMessage || typeof rawMessage !== 'string') return rawMessage

    const text = rawMessage.trim()
    if (!text) return 'Please check your details and try again.'

    // Handle specific concurrency error codes
    if (text.includes('already has sufficient workers') || text.includes('job is already full')) {
      return '⏰ This job just got filled! Another labourer was accepted. Try another job.'
    }

    if (text.includes('already applied')) {
      return '⏰ You already applied to this job. Wait for the farmer to respond.'
    }

    if (text.includes('already been accepted')) {
      return 'This application is already accepted.'
    }

    if (text.includes('already rated')) {
      return "You've already rated this job."
    }

    if (/jwt|token|session|expired|unauthorized/i.test(text)) {
      return 'Your session expired. Please sign in again.'
    }

    if (/phone|mobile|number/i.test(text) && /10|digits|digit/i.test(text)) {
      return 'Phone number must have 10 digits.'
    }

    if (/password/i.test(text) && /(short|too short|length|minimum)/i.test(text)) {
      return 'Password needs 6 or more letters.'
    }

    if (/already.*(used|exists|registered)|duplicate/i.test(text)) {
      return 'This number is already in use.'
    }

    if (/required|missing|fill|empty|cannot be empty/i.test(text)) {
      return 'Please fill all required boxes.'
    }

    if (/location/i.test(text) && /permission|access|denied|gps|browser/i.test(text)) {
      return 'Location is still missing. Try again.'
    }

    if (/network|offline|no internet|failed to fetch|fetch/i.test(text)) {
      return 'No internet. Check your connection.'
    }

    if (/forbidden|not allowed|permission/i.test(text)) {
      return 'You do not have access to this.'
    }

    if (/server|internal|unexpected|something went wrong/i.test(text)) {
      return 'Something went wrong. Please try again.'
    }

    return text.length > 90 ? `${text.slice(0, 87)}...` : text
  }

  if (isNetworkError) {
    return {
      status: 0,
      message: 'No internet. Check your connection.',
      isNetworkError: true,
    }
  }

  if (status === 401) {
    return {
      status,
      message: toFriendlyMessage(data?.message || data?.error || 'Your session expired. Please sign in again.'),
      isNetworkError: false,
    }
  }

  if (status === 400 || status === 422) {
    const detailsMessage = data?.details && typeof data.details === 'object'
      ? Object.values(data.details).find((value) => typeof value === 'string' && value.trim())
      : null

    return {
      status,
      message: toFriendlyMessage(detailsMessage || data?.message || data?.error || 'Please check your details and try again.'),
      isNetworkError: false,
    }
  }

  if (status === 403) {
    return {
      status,
      message: toFriendlyMessage(data?.message || data?.error || 'You do not have access to this.'),
      isNetworkError: false,
    }
  }

  // Handle 409 Conflict - Concurrency issues (JOB_ALREADY_FULL, ALREADY_APPLIED, DUPLICATE_RATING)
  if (status === 409) {
    return {
      status,
      code: errorCode,
      message: toFriendlyMessage(data?.message || data?.error || 'This action is no longer available.'),
      isNetworkError: false,
    }
  }

  if (status >= 500) {
    return {
      status,
      message: 'Something went wrong. Please try again.',
      isNetworkError: false,
    }
  }

  if (data) {
    if (typeof data === 'string' && data.trim()) {
      return { status, message: toFriendlyMessage(data.trim()), isNetworkError: false }
    }
    if (data.message) {
      return { status, message: toFriendlyMessage(data.message), isNetworkError: false }
    }
    if (data.error && typeof data.error === 'string') {
      return { status, message: toFriendlyMessage(data.error), isNetworkError: false }
    }
    const details = data.details
    if (details && typeof details === 'object') {
      const first = Object.values(details).find((value) => Boolean(value))
      if (typeof first === 'string') {
        return { status, message: toFriendlyMessage(first), isNetworkError: false }
      }
    }
  }

  return {
    status,
    message: 'Something went wrong. Please try again.',
    isNetworkError: false,
  }
}

export function getApiErrorDetails(error) {
  return error?.response?.data?.details || null
}

export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  const { message } = normalizeRequestError(error)
  return message || fallback
}

export function showAppToast(message, type = 'error', options = {}) {
  toast.dismiss('app-toast')
  const finalOptions = { id: 'app-toast', duration: 6000, ...options }

  if (type === 'success') {
    toast.success(message, finalOptions)
    return
  }

  toast.error(message, finalOptions)
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
  if (typeof config.url === 'string') {
    if (config.url.startsWith('/api/v1/')) {
      config.url = config.url.replace(/^\/api\/v1\//, '')
    } else if (config.url.startsWith('/')) {
      config.url = config.url.slice(1)
    }
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
    const normalized = normalizeRequestError(error)
    const isAuthRequest = !!error?.config?.url?.includes('/auth/')
    const isPublicRequest = isAuthRequest || !!error?.config?.url?.includes('/health')
    const token = useAuthStore.getState().token
    const suppressErrorToast = Boolean(error?.config?.suppressErrorToast)
    const currentPath = window.location.pathname

    if (!error.response) {
      if (!isPublicRequest && !suppressErrorToast) {
        showAppToast(normalized.message, 'error', {
          action: normalized.isNetworkError ? { label: 'Retry', onClick: () => window.location.reload() } : undefined,
        })
      }
      return Promise.reject(error)
    }

    const status = error.response.status

    if (status === 401) {
      if (!isAuthRequest) {
        useAuthStore.getState().logout()
        if (currentPath !== '/login') {
          window.location.href = '/login'
        }
        if (!suppressErrorToast) {
          showAppToast('Your session expired. Please sign in again.')
        }
      }
    } else if (status === 403) {
      if (!isAuthRequest) {
        if (token && currentPath !== '/unauthorized') {
          window.location.href = '/unauthorized'
          if (!suppressErrorToast) {
            showAppToast(normalized.message)
          }
        } else if (!token && currentPath !== '/login') {
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
      }
    } else if (status >= 500 && !isPublicRequest) {
      if (currentPath !== '/error') {
        window.location.href = '/error'
      }
      if (!suppressErrorToast) {
        showAppToast(normalized.message)
      }
    } else if (!isPublicRequest && !suppressErrorToast) {
      showAppToast(normalized.message)
    }

    return Promise.reject(error)
  }
)

export const unwrap = (response) => response.data.data

export default api
