// Minimal Firebase Cloud Messaging setup helper.
// This uses dynamic imports so the app still builds when `firebase` is not installed.
import api from './services/api'

let messaging = null
const enabled = import.meta.env.VITE_ENABLE_FCM === 'true'

export async function initFirebase() {
  if (!enabled) return null
  try {
    const configJson = import.meta.env.VITE_FIREBASE_CONFIG
    if (!configJson) return null
    const config = JSON.parse(configJson)
    const { initializeApp } = await import('firebase/app')
    const { getMessaging } = await import('firebase/messaging')
    const app = initializeApp(config)
    messaging = getMessaging(app)
    return messaging
  } catch {
    return null
  }
}

export async function requestAndRegisterFcm() {
  if (!enabled) return null
  try {
    if (!messaging) await initFirebase()
    if (!messaging) return null
    const { getToken } = await import('firebase/messaging')
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID
    const token = await getToken(messaging, { vapidKey })
    if (token) {
      await api.post('/auth/fcm-token', { fcmToken: token })
    }
    return token
  } catch {
    return null
  }
}

export async function listenForegroundMessages(callback) {
  if (!enabled) return
  if (!messaging) await initFirebase()
  if (!messaging) return
  const { onMessage } = await import('firebase/messaging')
  onMessage(messaging, (payload) => callback(payload))
}

export function isFcmEnabled() {
  return enabled
}
