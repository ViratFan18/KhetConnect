import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import './i18n'
import './index.css'
import App from './App.jsx'
import { initFirebase, requestAndRegisterFcm, listenForegroundMessages, isFcmEnabled } from './firebase'
import useAuthStore from './store/authStore'
import { normalizeRequestError, showAppToast } from './services/api'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query?.meta?.skipGlobalToast) return
      const normalized = normalizeRequestError(error)
      if (normalized.isNetworkError) {
        showAppToast(normalized.message, 'error', {
          action: { label: 'Retry', onClick: () => window.location.reload() },
        })
        return
      }
      if (normalized.status === 401) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return
      }
      if (normalized.status === 400 || normalized.status === 422) {
        showAppToast(normalized.message)
        return
      }
      showAppToast(normalized.message)
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation?.meta?.skipGlobalToast) return
      const normalized = normalizeRequestError(error)
      if (normalized.isNetworkError) {
        showAppToast(normalized.message, 'error', {
          action: { label: 'Retry', onClick: () => window.location.reload() },
        })
        return
      }
      if (normalized.status === 401) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return
      }
      if (normalized.status === 400 || normalized.status === 422) {
        showAppToast(normalized.message)
        return
      }
      showAppToast(normalized.message)
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const normalized = normalizeRequestError(error)
        if (normalized.isNetworkError && failureCount < 2) return true
        return false
      },
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
})

initFirebase()

// register FCM when user logs in (only if feature enabled)
useAuthStore.subscribe((s) => {
  if (s.token && isFcmEnabled()) requestAndRegisterFcm()
})

// Listen and broadcast foreground messages to components
if (isFcmEnabled()) {
  listenForegroundMessages((payload) => {
    const title = payload?.notification?.title || 'Notification'
    const body = payload?.notification?.body || ''
    // show toast
    toast(`${title}${body ? `: ${body}` : ''}`, { icon: '🔔' })
    // dispatch a window event so components can merge without refetch
    try {
      window.dispatchEvent(new CustomEvent('fcm:message', { detail: payload }))
    } catch (e) {
      /* ignore */
    }
  })

  // register service worker for background messages (if supported)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => {})
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
