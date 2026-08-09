import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api, { getApiErrorMessage, unwrap, showAppToast } from '../services/api'
import useAuthStore from '../store/authStore'
import Layout, { Button, PageHeader, StatusBadge, EmptyState } from '../components/Layout'
import Navbar from '../components/Navbar'
import BottomNavBar from '../components/BottomNavBar'
import RateJobModal from '../components/RateJobModal'

export default function Bookings() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [rateModal, setRateModal] = useState(null)

  async function loadBookings() {
    setLoading(true)
    try {
      const res = await api.get('/bookings/my')
      const bookingList = unwrap(res) || []
      setBookings(bookingList)

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
    } catch {
      showAppToast('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      await loadBookings()
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const completeBooking = async (booking) => {
    try {
      await api.put(`/bookings/${booking.id}/complete`)
      showAppToast('Booking marked complete', 'success')
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
      loadBookings()
    } catch (err) {
      showAppToast(getApiErrorMessage(err, 'Failed to complete booking'))
    }
  }

  const cancelBooking = async (id) => {
    try {
      await api.put(`/bookings/${id}/cancel`)
      showAppToast('Booking cancelled', 'success')
      loadBookings()
    } catch (err) {
      showAppToast(getApiErrorMessage(err, 'Failed to cancel booking'))
    }
  }

  return (
    <Layout>
      <Navbar />
      <div className="px-4 py-4">
        <PageHeader title={t('bookings')} backTo={user?.role === 'FARMER' ? '/farmer' : '/labourer'} subtitle={t('bookingOverview')} />
        <div className="mt-4 space-y-3">
          {loading ? (
            <EmptyState icon="⏳" title={t('loading')} description={t('loadingBookings')} />
          ) : bookings.length === 0 ? (
            <EmptyState icon="📘" title={t('noBookings')} description={t('noBookingsDescription')} />
          ) : (
            bookings.map((b) => (
              <div key={b.id} className="card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{b.availability.labourer?.name || b.availability.labourerName}</h3>
                    <p className="mt-2 text-sm text-slate-400">{t('workers')}: {b.workersBooked} · {t('amount')}: ₹{b.amount}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <div className="mt-4 space-y-3">
                  {b.status === 'APPROVED' && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button onClick={() => completeBooking(b)}>{t('markComplete')}</Button>
                      <Button onClick={() => cancelBooking(b.id)} variant="danger">{t('cancelJob')}</Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <BottomNavBar />

      {rateModal && (
        <RateJobModal
          job={rateModal.job}
          rateeId={rateModal.rateeId}
          rateeName={rateModal.rateeName}
          onSubmit={rateModal.onSubmit}
          onClose={() => setRateModal(null)}
          onSuccess={() => {
            setRateModal(null)
            loadBookings()
          }}
        />
      )}
    </Layout>
  )
}
