import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api, { unwrap } from '../services/api'
import useAuthStore from '../store/authStore'
import Navbar from '../components/Navbar'
import BottomNavBar from '../components/BottomNavBar'
import JobCard from '../components/JobCard'
import Layout from '../components/Layout'
import { JobCardSkeleton } from '../components/Skeleton'

const FILTERS = ['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

export default function FarmerHistory() {
  const { t } = useTranslation()
  const [jobs, setJobs] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/history/farmer').then((res) => {
      setJobs(unwrap(res) || [])
      setLoading(false)
    })
  }, [])

  const filtered = filter === 'ALL' ? jobs : jobs.filter((j) => j.status === filter)
  const completed = jobs.filter((j) => j.status === 'COMPLETED')
  const totalSpent = completed.reduce(
    (sum, j) => sum + (j.wagePerDay || 0) * (j.acceptedCount || 0),
    0
  )

  return (
    <Layout>
      <Navbar />
      <div className="px-4 py-4">
        <h1 className="mb-4 text-xl font-bold">{t('workHistory')}</h1>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <SummaryCard label={t('totalJobs')} value={jobs.length} />
          <SummaryCard label={t('totalCompleted')} value={completed.length} />
          <SummaryCard label={t('totalSpent')} value={`₹${totalSpent}`} />
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                filter === f ? 'bg-primary text-white' : 'bg-white text-gray-700'
              }`}
            >
              {f === 'ALL' ? t('all') : t(f === 'IN_PROGRESS' ? 'ongoing' : f.toLowerCase())}
            </button>
          ))}
        </div>

        {loading ? (
          <JobCardSkeleton />
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-gray-500">{t('noHistory')}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
      <BottomNavBar />
    </Layout>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-3 text-center shadow-sm">
      <p className="text-lg font-bold text-primary">{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  )
}

export function LabourHistoryPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [jobs, setJobs] = useState([])
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/history/labourer'),
      api.get(`/users/${user.id}/ratings`),
    ]).then(([jobsRes, ratingsRes]) => {
      setJobs(unwrap(jobsRes) || [])
      setRatings(unwrap(ratingsRes) || [])
      setLoading(false)
    })
  }, [user.id])

  const totalEarned = jobs.reduce((sum, j) => sum + (j.wagePerDay || 0), 0)
  const now = new Date()
  const monthEarnings = jobs
    .filter((j) => {
      const d = new Date(j.workDate)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, j) => sum + (j.wagePerDay || 0), 0)
  const avgRating = ratings.length
    ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1)
    : '0'

  return (
    <Layout>
      <Navbar />
      <div className="px-4 py-4">
        <h1 className="mb-4 text-xl font-bold">{t('workHistory')}</h1>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <SummaryCard label={t('totalJobs')} value={jobs.length} />
          <SummaryCard label={t('totalEarned')} value={`₹${totalEarned}`} />
          <SummaryCard label={t('avgRating')} value={avgRating} />
          <SummaryCard label={t('monthEarnings')} value={`₹${monthEarnings}`} />
        </div>

        {loading ? (
          <JobCardSkeleton />
        ) : jobs.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-gray-500">{t('noHistory')}</div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="rounded-xl bg-white p-4 shadow-sm">
                <h3 className="font-semibold">{job.title}</h3>
                <p className="text-sm text-gray-600">{job.farmerName} · {job.workDate}</p>
                <p className="mt-1 font-bold text-primary">₹{job.wagePerDay}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNavBar />
    </Layout>
  )
}
