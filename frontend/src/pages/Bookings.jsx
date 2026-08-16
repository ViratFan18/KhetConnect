import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import api, { getApiErrorMessage, unwrap, showAppToast } from '../services/api'
import useAuthStore from '../store/authStore'
import Layout from '../components/Layout'
import Navbar from '../components/Navbar'
import BottomNavBar from '../components/BottomNavBar'
import StarRating from '../components/StarRating'
import RateJobModal from '../components/RateJobModal'
import { queryKeys } from '../queryKeys'

const statusColors = {
  PENDING: { bg: 'bg-amber-500/12', text: 'text-amber-200', border: 'border-amber-400/30' },
  APPROVED: { bg: 'bg-emerald-500/12', text: 'text-emerald-200', border: 'border-emerald-400/30' },
  COMPLETED: { bg: 'bg-slate-500/12', text: 'text-slate-200', border: 'border-slate-400/30' },
  CANCELLED: { bg: 'bg-rose-500/12', text: 'text-rose-200', border: 'border-rose-400/30' },
}

export default function Bookings() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [rateModal, setRateModal] = useState(null)

  const { data: bookings = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.bookings,
    staleTime: 30_000,
    queryFn: async () => {
      const res = await api.get('/bookings/my')
      return unwrap(res) || []
    },
    onSuccess: (bookingList) => {
      const pendingLabourerReview = bookingList.find(
        (b) => b.status === 'COMPLETED' && !b.reviewedByLabourer
      )
      if (user?.role === 'LABOURER' && pendingLabourerReview) {
        setRateModal({
          job: {
            id: pendingLabourerReview.id,
            title: pendingLabourerReview.availability?.skills || 'Completed booking',
          },
          rateeId: pendingLabourerReview.farmerId,
          rateeName: pendingLabourerReview.farmerName,
          onSubmit: async ({ rating, comment }) => {
            await api.post(`/bookings/${pendingLabourerReview.id}/review`, { rating, comment }, { suppressErrorToast: true })
          },
        })
      }
    },
  })

  const completeMutation = useMutation({
    mutationFn: async (booking) => {
      await api.put(`/bookings/${booking.id}/complete`)
      return booking
    },
    onSuccess: async (booking) => {
      showAppToast('✓ Booking marked complete', 'success')
      if (user?.role === 'LABOURER') {
        setRateModal({
          job: { id: booking.id, title: booking.availability?.skills || 'Completed booking' },
          rateeId: booking.farmerId,
          rateeName: booking.farmerName,
          onSubmit: async ({ rating, comment }) => {
            await api.post(`/bookings/${booking.id}/review`, { rating, comment }, { suppressErrorToast: true })
          },
        })
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.bookings })
    },
    onError: (err) => showAppToast(getApiErrorMessage(err, 'Could not mark booking complete')),
  })

  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      await api.put(`/bookings/${id}/cancel`)
      return id
    },
    onSuccess: async () => {
      showAppToast('✓ Booking cancelled', 'success')
      await queryClient.invalidateQueries({ queryKey: queryKeys.bookings })
    },
    onError: (err) => showAppToast(getApiErrorMessage(err, 'Could not cancel booking')),
  })

  const completeBooking = async (booking) => {
    if (!window.confirm('Mark this booking as complete?')) return
    completeMutation.mutate(booking)
  }
  const cancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking?')) return
    cancelMutation.mutate(id)
  }

  return (
    <Layout>
      <Navbar />
      <div className="px-3 py-6 sm:px-4">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/8 via-slate-950 to-slate-950 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_30%)]" />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">Your Applications</p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl">{t('bookings')}</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-300">Track your job applications and accepted bookings.</p>
          </div>
        </div>

        {/* Bookings List */}
        <div className="mt-8">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-slate-900/40 p-6 animate-pulse">
                  <div className="h-4 bg-slate-800/50 rounded w-2/3"></div>
                  <div className="mt-3 h-3 bg-slate-800/30 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-10 text-center">
              <span className="text-5xl">📘</span>
              <p className="mt-4 text-lg font-semibold text-slate-200">No applications yet</p>
              <p className="mt-2 text-sm text-slate-400">Browse nearby jobs and apply to start earning</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const statusColor = statusColors[b.status] || statusColors.PENDING
                return (
                  <div key={b.id} className={`rounded-xl border transition-all p-4 sm:p-5 ${statusColor.border} ${statusColor.bg}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            {b.availability?.labourer?.name || b.availability?.labourerName}
                          </p>
                          <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 ${statusColor.border} ${statusColor.bg}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                            <span className={`text-xs font-semibold ${statusColor.text}`}>{t(b.status.toLowerCase())}</span>
                          </div>
                        </div>
                        
                        <p className="mt-2 text-lg font-semibold text-white">{b.availability?.skills || 'Job Application'}</p>
                        
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <span>👷</span>
                            <span>{b.workersBooked} workers booked</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <span>💰</span>
                            <span>₹{b.amount} total</span>
                          </div>
                        </div>

                        {b.farmerName && (
                          <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/50 p-3">
                            <p className="text-xs text-slate-400">Booked with</p>
                            <p className="mt-1 font-semibold text-white">{b.farmerName}</p>
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      {b.status === 'PENDING' && (
                        <span className="shrink-0 flex h-3 w-3 rounded-full bg-amber-400 animate-pulse"></span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {b.status === 'APPROVED' && (
                      <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2 sm:flex-row">
                        <button
                          onClick={() => completeBooking(b)}
                          disabled={completeMutation.isPending}
                          className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60"
                        >
                          {completeMutation.isPending ? '⏳ Completing...' : '✓ Mark Complete'}
                        </button>
                        <button
                          onClick={() => cancelBooking(b.id)}
                          disabled={cancelMutation.isPending}
                          className="flex-1 rounded-lg border border-rose-400/30 bg-rose-500/12 px-4 py-2.5 font-semibold text-rose-200 hover:bg-rose-500/20 transition disabled:opacity-60"
                        >
                          {cancelMutation.isPending ? '⏳ Cancelling...' : '✗ Cancel'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <BottomNavBar />

      {rateModal && (
        <RateJobModal
          job={rateModal.job}
          rateeId={rateModal.rateeId}
          rateeName={rateModal.rateeName}
          onClose={() => setRateModal(null)}
          onSuccess={() => setRateModal(null)}
        />
      )}
    </Layout>
  )
}
