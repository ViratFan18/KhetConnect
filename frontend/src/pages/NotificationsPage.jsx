import { useEffect, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import api, { unwrap } from '../services/api'
import Navbar from '../components/Navbar'
import BottomNavBar from '../components/BottomNavBar'
import Layout from '../components/Layout'
import { queryKeys } from '../queryKeys'
import { getVisibleNotifications } from '../utils/notifications'

export default function NotificationsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const hasMarkedReadRef = useRef(false)

  const { data: notifications = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.notifications,
    staleTime: 15_000,
    queryFn: async () => {
      const res = await api.get('/notifications')
      return unwrap(res) || []
    },
  })

  const markReadMutation = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read')
    },
    onSuccess: async () => {
      hasMarkedReadRef.current = true
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })

  useEffect(() => {
    if (!loading && notifications.length && !hasMarkedReadRef.current && notifications.some((n) => !n.read)) {
      markReadMutation.mutate()
    }
  }, [loading, notifications, markReadMutation])

  const recentNotifications = useMemo(() => getVisibleNotifications(notifications), [notifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Layout>
      <Navbar />
      <div className="px-3 py-6 sm:px-4">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-500/8 via-slate-950 to-slate-950 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.15),transparent_30%)]" />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-200/80">Updates & Alerts</p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl">Your Notifications</h1>
            {unreadCount > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse"></span>
                <span className="text-sm font-semibold text-rose-200">{unreadCount} new</span>
              </div>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="mt-8">
          {loading ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 animate-pulse">
                <div className="h-4 bg-slate-800/50 rounded w-2/3"></div>
                <div className="mt-3 h-3 bg-slate-800/30 rounded w-full"></div>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 animate-pulse">
                <div className="h-4 bg-slate-800/50 rounded w-2/3"></div>
                <div className="mt-3 h-3 bg-slate-800/30 rounded w-full"></div>
              </div>
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-10 text-center">
              <span className="text-5xl">🔔</span>
              <p className="mt-4 text-lg font-semibold text-slate-200">All caught up!</p>
              <p className="mt-2 text-sm text-slate-400">No notifications yet. You'll see updates here as they arrive.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map((n) => {
                const isUnread = !n.read
                const notificationType = n.type || 'default'
                
                const typeColors = {
                  'job_applied': { icon: '📝', label: 'Application' },
                  'job_accepted': { icon: '✓', label: 'Accepted' },
                  'job_rejected': { icon: '✗', label: 'Rejected' },
                  'job_completed': { icon: '🏆', label: 'Completed' },
                  'job_cancelled': { icon: '✗', label: 'Cancelled' },
                  'labourer_accepted': { icon: '✓', label: 'Hired' },
                  'message': { icon: '💬', label: 'Message' },
                  'default': { icon: '📢', label: 'Update' }
                }
                
                const typeInfo = typeColors[notificationType] || typeColors.default

                return (
                  <div
                    key={n.id}
                    className={`rounded-xl border transition-all p-4 sm:p-5 ${
                      isUnread
                        ? 'border-violet-400/30 bg-gradient-to-r from-violet-500/12 to-slate-900/40'
                        : 'border-white/10 bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{typeInfo.icon}</span>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{typeInfo.label}</p>
                          {isUnread && <span className="inline-block h-2 w-2 rounded-full bg-violet-400 animate-pulse"></span>}
                        </div>
                        <p className="mt-2 text-base font-semibold text-white">{n.title}</p>
                        <p className="mt-1 text-sm text-slate-300">{n.body}</p>
                        <p className="mt-3 text-xs text-slate-500">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {isUnread && (
                        <div className="shrink-0 flex h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.6)]" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <BottomNavBar />
    </Layout>
  )
}
