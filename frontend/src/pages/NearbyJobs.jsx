import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api, { unwrap } from '../services/api'
import Navbar from '../components/Navbar'
import BottomNavBar from '../components/BottomNavBar'
import JobCard from '../components/JobCard'
import Layout, { PrimaryButton } from '../components/Layout'
import { getCurrentLocation, updateUserLocation } from '../utils/location'
import { JobCardSkeleton } from '../components/Skeleton'

const FILTERS = ['ALL', 'HARVESTING', 'PLANTING', 'IRRIGATION', 'SPRAYING', 'WEEDING', 'OTHER']

export default function NearbyJobs() {
  const { t } = useTranslation()
  const [jobs, setJobs] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [locationError, setLocationError] = useState(false)

  useEffect(() => {
    loadJobs()
  }, [])

  async function loadJobs() {
    setLoading(true)
    setLocationError(false)
    try {
      const { lat, lng } = await getCurrentLocation()
      await updateUserLocation(lat, lng)
      const res = await api.get('/jobs/nearby', { params: { lat, lng } })
      setJobs(unwrap(res) || [])
    } catch {
      setLocationError(true)
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'ALL' ? jobs : jobs.filter((j) => j.workType === filter)

  return (
    <Layout>
      <Navbar />
      <div className="px-4 py-4">
        <div className="mb-4 rounded-[24px] border border-white/10 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-400">{t('nearbyJobs')}</p>
              <h1 className="mt-1 text-xl font-semibold text-white">{t('oneTapApply')}</h1>
            </div>
            <PrimaryButton onClick={loadJobs} className="!w-auto px-4 py-2 text-sm">
              {t('refresh')}
            </PrimaryButton>
          </div>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                filter === f ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-900/70 text-slate-300'
              }`}
            >
              {f === 'ALL' ? t('filterAll') : t(f.toLowerCase())}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            <JobCardSkeleton />
            <JobCardSkeleton />
          </div>
        ) : locationError ? (
          <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-8 text-center">
            <span className="text-4xl">📍</span>
            <p className="mt-2 text-slate-300">{t('locationDenied')}</p>
            <PrimaryButton onClick={loadJobs} className="mt-4">
              {t('retry')}
            </PrimaryButton>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-8 text-center">
            <span className="text-4xl">🔍</span>
            <p className="mt-2 font-medium text-white">{t('noJobsNearby')}</p>
            <p className="text-sm text-slate-400">{t('noJobsNearbyDesc')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} onApplySuccess={() => loadJobs()} />
            ))}
          </div>
        )}
      </div>
      <BottomNavBar />
    </Layout>
  )
}
