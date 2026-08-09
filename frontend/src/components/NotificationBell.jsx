import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { unwrap } from '../services/api'
import useAuthStore from '../store/authStore'

export default function NotificationBell() {
  const [count, setCount] = useState(0)
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    if (!token) {
      return undefined
    }

    const fetchCount = async () => {
      try {
        const res = await api.get('/notifications')
        const list = unwrap(res) || []
        setCount(list.filter((n) => !n.read).length)
      } catch {
        /* ignore */
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [token])

  if (!token) return null

  return (
    <Link to="/notifications" className="relative p-1">
      <span className="text-xl">🔔</span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
