import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { unwrap } from '../services/api'
import useAuthStore from '../store/authStore'
import Navbar from '../components/Navbar'
import BottomNavBar from '../components/BottomNavBar'
import RateJobModal from '../components/RateJobModal'
import Layout, { PrimaryButton } from '../components/Layout'
import { getCurrentLocation, updateUserLocation } from '../utils/location'

export default function LabourDashboard() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [nearbyCount, setNearbyCount] = useState(0)
  const [monthEarnings, setMonthEarnings] = useState(0)
  const [loading, setLoading] = useState(false)
  const [locationError, setLocationError] = useState(false)
  const [rateModal, setRateModal] = useState(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setLocationError(false)
    try {
      const { lat, lng } = await getCurrentLocation()
      await updateUserLocation(lat, lng)
      const [nearbyRes, historyRes, ratingsRes] = await Promise.all([
        api.get('/jobs/nearby', { params: { lat, lng } }),
        api.get('/history/labourer'),
        api.get('/ratings/given'),
      ])

      const nearby = unwrap(nearbyRes) || []
      setNearbyCount(nearby.length)

      const history = unwrap(historyRes) || []
      const now = new Date()
      const monthTotal = history
        .filter((j) => {
          const d = new Date(j.workDate)
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        })
        .reduce((sum, j) => sum + (j.wagePerDay || 0), 0)
      setMonthEarnings(monthTotal)

      const myRatings = unwrap(ratingsRes) || []
      const ratedJobIds = new Set(myRatings.map((r) => r.jobId))
      const unrated = history.find(
        (j) => j.status === 'COMPLETED' && !ratedJobIds.has(j.id)
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
      setLocationError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Navbar />
      <div className="px-4 py-4">
        <div className="glass-card glass-panel p-6">
          <div className="flex flex-col gap-4 rounded-[32px] border border-cyan-400/10 bg-slate-950/95 p-5 shadow-[0_28px_100px_-50px_rgba(56,189,248,0.55)]">
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/15 bg-slate-900/85 px-4 py-2 text-xs uppercase tracking-[0.3em] text-cyan-300 shadow-[0_12px_36px_-30px_rgba(56,189,248,0.45)]">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_0_4px_rgba(56,189,248,0.14)]"></span>
                {t('appName')}
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-white">{t('welcome')}, {user?.name} 👋</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">Peak experience for every farmer and labourer — premium cards, bold contrast, and sharper actions.</p>
              </div>
            </div>
            <div className="grid gap-4 rounded-[28px] border border-cyan-400/10 bg-slate-950/90 p-5 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.12)] sm:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-slate-900/90 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{t('liveRadius')}</p>
                <p className="mt-3 text-3xl font-semibold text-cyan-300">5 km</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-slate-900/90 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{t('nearbyWorkers')}</p>
                <p className="mt-3 text-3xl font-semibold text-sky-300">{loading ? '...' : nearbyCount}</p>
              </div>
            </div>
          </div>
        </div>

        {hasLoaded ? (
          <>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/nearby-jobs"
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
              >
                {t('browseJobs')}
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-white/10 bg-slate-900/70 p-4">
                <p className="text-2xl font-bold text-cyan-300">{loading ? '...' : nearbyCount}</p>
                <p className="mt-1 text-sm text-slate-400">{t('nearbyCount')}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-slate-900/70 p-4">
                <p className="text-2xl font-bold text-cyan-300">₹{loading ? '...' : monthEarnings}</p>
                <p className="mt-1 text-sm text-slate-400">{t('monthEarnings')}</p>
              </div>
            </div>

          </>
        ) : (
          <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-900/70 p-6 text-center">
            <p className="text-sm text-slate-300">{t('updateLocationToSeeJobs')}</p>
            <PrimaryButton onClick={loadData} className="mt-4">
              {loading ? t('loading') : t('loadNearbyJobs')}
            </PrimaryButton>
            {locationError && (
              <p className="mt-3 text-sm text-rose-300">{t('locationDenied')}</p>
            )}
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
