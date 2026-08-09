import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { unwrap } from '../services/api'
import useAuthStore from '../store/authStore'
import Navbar from '../components/Navbar'
import BottomNavBar from '../components/BottomNavBar'
import JobCard from '../components/JobCard'
import Layout, { Button, EmptyState } from '../components/Layout'
import { JobCardSkeleton } from '../components/Skeleton'

export default function FarmerDashboard() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const jobsRes = await api.get('/jobs/my-posts')
      setJobs(unwrap(jobsRes) || [])
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false)
    }
  }

  const openJobs = jobs.filter((j) => j.status === 'OPEN').length
  const inProgressJobs = jobs.filter((j) => j.status === 'IN_PROGRESS').length
  const completedJobs = jobs.filter((j) => j.status === 'COMPLETED').length

  return (
    <Layout>
      <Navbar />
      <div className="px-4 py-4">
        <div className="glass-card glass-panel p-6">
          <div className="rounded-[32px] border border-cyan-400/10 bg-slate-950/95 p-6 shadow-[0_28px_100px_-50px_rgba(56,189,248,0.55)]">
            <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-400">{t('farmerSection')}</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">{t('welcome')}, {user?.name} 👋</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Post once, reach nearby workers instantly with premium controls and bold contrast.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <StatCard label={t('jobsPosted')} value={jobs.length} className="glass-card" />
          <StatCard label={t('openJobs')} value={openJobs} className="glass-card" />
          <StatCard label={t('inProgressJobs')} value={inProgressJobs} className="glass-card" />
          <StatCard label={t('completedJobs')} value={completedJobs} className="glass-card" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link to="/post-job" className="block">
            <Button className="w-full btn-gradient">{t('postNewJob')}</Button>
          </Link>
          <Link to="/my-jobs" className="block">
            <Button className="w-full" variant="secondary">{t('viewMyJobs')}</Button>
          </Link>
        </div>

        <h2 className="mb-3 mt-6 text-lg font-semibold text-white">{t('recentActivity')}</h2>
        {loading ? (
          <div className="space-y-3">
            <JobCardSkeleton />
            <JobCardSkeleton />
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState icon="🌱" title={t('noActivity')} description={t('noJobsYet')} action={<Button onClick={() => window.location.assign('/post-job')}>{t('postNewJob')}</Button>} />
        ) : (
          <div className="space-y-3">
            {jobs.slice(0, 5).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
      <BottomNavBar />

    </Layout>
  )
}

function StatCard({ label, value, className = '' }) {
  return (
    <div className={`rounded-[22px] border border-white/10 bg-slate-900/70 p-4 ${className}`}>
      <p className="text-2xl font-bold text-cyan-300">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  )
}
