import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { unwrap } from '../services/api'
import useAuthStore from '../store/authStore'
import Navbar from '../components/Navbar'
import BottomNavBar from '../components/BottomNavBar'
import JobCard from '../components/JobCard'
import RateJobModal from '../components/RateJobModal'
import Layout, { Button, EmptyState } from '../components/Layout'
import { JobCardSkeleton } from '../components/Skeleton'
import MotionWrapper from '../components/MotionWrapper'

export default function FarmerDashboard() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [rateModal, setRateModal] = useState(null)

  async function loadData() {
    setLoading(true)
    try {
      const jobsRes = await api.get('/jobs/my-posts')
      const page = unwrap(jobsRes) || { items: [] }
      const nextJobs = Array.isArray(page) ? page : page.items || []
      setJobs(nextJobs)
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [])

  const safeJobs = Array.isArray(jobs) ? jobs : []
  const openJobs = safeJobs.filter((j) => j.status === 'OPEN').length
  const inProgressJobs = safeJobs.filter((j) => j.status === 'IN_PROGRESS').length
  const completedJobs = safeJobs.filter((j) => j.status === 'COMPLETED').length
  const recentJobs = safeJobs
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 3)

  return (
    <Layout>
      <Navbar />
      <div className="px-3 py-6 sm:px-4">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-amber-500/8 via-slate-950 to-slate-950 p-6 sm:p-8 shadow-[0_20px_60px_-35px_rgba(255,122,89,0.3)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,89,0.15),transparent_30%)]" />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/80">Farm Management</p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl">{t('welcome')}, {user?.name}!</h1>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/post-job" className="flex-1">
            <Button className="w-full">{t('postNewJob')}</Button>
          </Link>
          <Link to="/my-jobs" className="flex-1">
            <Button className="w-full" variant="secondary">{t('viewMyJobs')}</Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t('jobsPosted')} value={safeJobs.length} icon="📋" accent="slate" />
          <StatCard label={t('openJobs')} value={openJobs} icon="📂" accent="amber" isActive={openJobs > 0} />
          <StatCard label={t('inProgressJobs')} value={inProgressJobs} icon="⚙️" accent="amber" isActive={inProgressJobs > 0} />
          <StatCard label={t('completedJobs')} value={completedJobs} icon="✓" accent="emerald" />
        </div>

        {/* Recent Activity Section */}
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-[-0.05em] text-white">{t('recentActivity')}</h2>
              <p className="mt-1 text-sm text-slate-400">Latest job postings and updates</p>
            </div>
            {safeJobs.length > 0 && (
              <Link to="/my-jobs" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">View all →</Link>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </div>
          ) : safeJobs.length === 0 ? (
            <EmptyState
              icon="🌾"
              title={t('noActivity')}
              description={t('noJobsYet')}
              action={<Button onClick={() => window.location.assign('/post-job')}>{t('postNewJob')}</Button>}
            />
          ) : (
            <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-slate-900/40 p-4 sm:p-6">
              {recentJobs.map((job) => (
                <div key={job.id} className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                  <JobCard job={job} />
                  {job.status === 'COMPLETED' && !job.ratedByCurrentUser && (
                    <button
                      onClick={() => {
                        const acceptedApplicant = job.applicants?.find((a) => a.status === 'ACCEPTED')
                        if (acceptedApplicant) {
                          setRateModal({
                            job,
                            rateeId: acceptedApplicant.labourerId,
                            rateeName: acceptedApplicant.name,
                            onSubmit: async ({ rating, comment }) => {
                              await api.post('/ratings', { jobId: job.id, rateeId: acceptedApplicant.labourerId, stars: rating, comment }, { suppressErrorToast: true })
                            },
                          })
                        }
                      }}
                      className="mt-2 w-full rounded-lg border border-emerald-400/30 bg-emerald-500/12 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
                    >
                      ⭐ Give Review
                    </button>
                  )}
                </div>
              ))}
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
          onSuccess={loadData}
        />
      )}
    </Layout>
  )
}

function StatCard({ label, value, icon, accent = 'slate', isActive = false }) {
  const accentClasses = {
    slate: 'border-slate-400/20 bg-slate-500/8 text-slate-200 dot-slate',
    amber: isActive ? 'border-amber-400/40 bg-amber-500/12 text-amber-100 dot-amber' : 'border-slate-400/20 bg-slate-500/8 text-slate-200 dot-slate',
    emerald: 'border-emerald-400/20 bg-emerald-500/8 text-emerald-100 dot-emerald',
  }

  const accentColor = {
    slate: 'bg-slate-400',
    amber: 'bg-amber-400',
    emerald: 'bg-emerald-400',
  }[accent] || 'bg-slate-400'

  return (
    <div className={`relative overflow-hidden rounded-[1.3rem] border p-4 sm:p-5 transition-all duration-200 ${accentClasses[accent]}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,currentColor,transparent_60%)] opacity-0" />
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-2xl font-bold text-current">{value}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-current/70">{label}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
      <div className="mt-3 h-1 w-full rounded-full bg-current/10">
        <div className={`h-full w-${Math.min(100, Math.max(10, value * 20))}% rounded-full ${accentColor} shadow-[0_0_12px_${accentColor}80]`} />
      </div>
    </div>
  )
}
