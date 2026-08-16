import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { unwrap } from '../services/api'
import useAuthStore from '../store/authStore'
import Navbar from '../components/Navbar'
import BottomNavBar from '../components/BottomNavBar'
import RateJobModal from '../components/RateJobModal'
import Layout from '../components/Layout'
import { getCurrentLocation, updateUserLocation } from '../utils/location'

export default function LabourDashboard() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [nearbyJobCount, setNearbyJobCount] = useState(0)
  const [monthEarnings, setMonthEarnings] = useState(0)
  const [loading, setLoading] = useState(false)
  const [locationError, setLocationError] = useState(false)
  const [rateModal, setRateModal] = useState(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [coordinates, setCoordinates] = useState(null)

  async function loadData() {
    setLoading(true)
    setLocationError(false)
    try {
      const { lat, lng } = await getCurrentLocation()
      setCoordinates({ lat, lng })
      await updateUserLocation(lat, lng)

      const [nearbyRes, historyRes] = await Promise.all([
        api.get('/jobs/nearby', { params: { lat, lng } }),
        api.get('/history/labourer'),
      ])

      const nearby = unwrap(nearbyRes) || []
      setNearbyJobCount(nearby.length)

      const history = unwrap(historyRes) || []
      const now = new Date()
      const monthTotal = history
        .filter((j) => {
          const d = new Date(j.workDate)
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        })
        .reduce((sum, j) => sum + (j.wagePerDay || 0), 0)
      setMonthEarnings(monthTotal)

      const unrated = history.find(
        (j) => j.status === 'COMPLETED' && !j.ratedByCurrentUser
      )
      if (unrated) {
        setRateModal({
          job: unrated,
          rateeId: unrated.farmerId,
          rateeName: unrated.farmerName,
          onSubmit: async ({ rating, comment }) => {
            await api.post('/ratings', { jobId: unrated.id, rateeId: unrated.farmerId, stars: rating, comment }, { suppressErrorToast: true })
          },
        })
      }
      setHasLoaded(true)
    } catch {
      setHasLoaded(false)
      setLocationError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Navbar />
      <div className="px-3 py-6 sm:px-4">
        {/* Premium Hero Section */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/8 via-slate-950 to-slate-950 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_30%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              {t('appName')}
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl">
              {t('welcome')}, <span className="text-cyan-300">{user?.name?.split(' ')[0]}</span>
            </h1>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Nearby Jobs</p>
            <p className="mt-3 text-3xl font-bold text-cyan-400">{loading ? '...' : nearbyJobCount}</p>
            <p className="mt-1 text-xs text-slate-400">Within 5 km radius</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">This Month</p>
            <p className="mt-3 text-3xl font-bold text-emerald-400">
              ₹{loading ? '...' : monthEarnings.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-400">Earnings</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Location</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <p className="text-lg font-semibold text-white">
                {coordinates ? 'Active' : 'Inactive'}
              </p>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {coordinates ? 'Sharing location' : 'Enable to find jobs'}
            </p>
          </div>
        </div>

        {/* CTA Section */}
        {hasLoaded ? (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/nearby-jobs"
              className="flex-1 rounded-xl border border-cyan-400/30 bg-cyan-500/12 px-6 py-4 text-center font-semibold text-cyan-200 hover:bg-cyan-500/20 transition shadow-[0_0_12px_rgba(34,211,238,0.15)]"
            >
              🔍 Browse Nearby Jobs
            </Link>
            <Link
              to="/bookings"
              className="flex-1 rounded-xl border border-emerald-400/30 bg-emerald-500/12 px-6 py-4 text-center font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
            >
              ✓ My Bookings
            </Link>
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 text-center">
            <span className="text-5xl">📍</span>
            <p className="mt-4 text-lg font-semibold text-slate-200">Location access needed</p>
            <p className="mt-2 text-sm text-slate-400">We need your location to show nearby jobs within 5 km</p>
            <button
              onClick={loadData}
              disabled={loading}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-3 font-semibold text-white hover:bg-cyan-700 transition disabled:opacity-60"
            >
              {loading ? '⏳ Loading location...' : '🎯 Enable Location'}
            </button>
            {locationError && (
              <div className="mt-4 flex items-center gap-2 justify-center p-3 rounded-lg bg-rose-500/10 border border-rose-400/30">
                <span>⚠️</span>
                <p className="text-sm text-rose-200">{t('locationDenied')}</p>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        {hasLoaded && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold tracking-[-0.05em] text-white mb-4">Quick Links</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                to="/history"
                className="rounded-xl border border-white/10 bg-slate-900/40 p-4 hover:border-white/20 hover:bg-slate-900/60 transition"
              >
                <p className="text-sm font-semibold text-slate-300">📊 Work History</p>
                <p className="mt-1 text-xs text-slate-400">View completed jobs and earnings</p>
              </Link>
              <Link
                to="/profile"
                className="rounded-xl border border-white/10 bg-slate-900/40 p-4 hover:border-white/20 hover:bg-slate-900/60 transition"
              >
                <p className="text-sm font-semibold text-slate-300">👤 My Profile</p>
                <p className="mt-1 text-xs text-slate-400">View and edit your profile</p>
              </Link>
            </div>
          </div>
        )}
      </div>
      <BottomNavBar />

      {rateModal && (
        <RateJobModal
          job={rateModal.job}
          rateeId={rateModal.rateeId}
          rateeName={rateModal.rateeName}
          onClose={() => setRateModal(null)}
          onSuccess={loadData}
        />
      )}
    </Layout>
  )
}
