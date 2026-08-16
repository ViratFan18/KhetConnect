import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { unwrap } from '../services/api'
import useAuthStore from '../store/authStore'
import { getVisibleNotifications } from '../utils/notifications'

export default function NotificationBell() {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    if (!token) {
      return undefined
    }

    const fetchCount = async () => {
      try {
        setIsLoading(true)
        const res = await api.get('/notifications')
        const list = getVisibleNotifications(unwrap(res) || [])
        setCount(list.filter((n) => !n.read).length)
      } catch {
        /* ignore */
      } finally {
        setIsLoading(false)
      }
    }

    fetchCount()

    // refresh when tab/window gains focus (on-demand, not polling)
    const onFocus = () => fetchCount()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') fetchCount()
    })

    // listen for incoming foreground FCM messages to increment/count locally
    const onFcm = (e) => {
      try {
        const payload = e.detail
        // payload may include notification body; increment optimistic count
        setCount((c) => c + 1)
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('fcm:message', onFcm)

    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('fcm:message', onFcm)
      document.removeEventListener('visibilitychange', () => {})
    }
  }, [token])

  if (!token) return null

  return (
    <Link
      to="/notifications"
      className="relative inline-flex items-center justify-center p-2 rounded-lg hover:bg-white/5 transition"
      title="Notifications"
    >
      <span className={`text-xl transition-transform ${isLoading ? 'animate-spin' : ''}`}>
        🔔
      </span>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-xs font-bold text-white shadow-lg shadow-rose-500/30 animate-pulse">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
