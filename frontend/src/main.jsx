import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import toast from 'react-hot-toast'
import './i18n'
import './index.css'
import App from './App.jsx'
import { initFirebase, requestAndRegisterFcm, listenForegroundMessages } from './firebase'
import useAuthStore from './store/authStore'

initFirebase()

// register FCM when user logs in
useAuthStore.subscribe((s) => {
  if (s.token) requestAndRegisterFcm()
})

listenForegroundMessages((payload) => {
  const title = payload?.notification?.title || 'Notification'
  const body = payload?.notification?.body || ''
  toast(`${title}${body ? `: ${body}` : ''}`, { icon: '🔔' })
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
