import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import api, { unwrap } from '../services/api'
import Navbar from '../components/Navbar'
import BottomNavBar from '../components/BottomNavBar'
import Layout from '../components/Layout'

export default function NotificationsPage() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const fetchNotifications = async () => {
      setLoading(true)
      try {
        const res = await api.get('/notifications')
        if (active) setNotifications(unwrap(res) || [])
        await api.put('/notifications/read')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchNotifications()
    return () => {
      active = false
    }
  }, [])

  return (
    <Layout>
      <Navbar />
      <div className="px-4 py-4">
        <h1 className="mb-4 text-xl font-bold">{t('notifications')}</h1>

        {loading ? (
          <p className="text-center text-gray-500">{t('loading')}</p>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center">
            <span className="text-4xl">🔔</span>
            <p className="mt-2 text-gray-500">{t('noNotifications')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl bg-white p-4 shadow-sm ${
                  !n.read ? 'border-l-4 border-primary' : 'opacity-75'
                }`}
              >
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-gray-600">{n.body}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNavBar />
    </Layout>
  )
}
