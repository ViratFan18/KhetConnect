import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api, { unwrap } from '../services/api'
import useAuthStore from '../store/authStore'
import Navbar from '../components/Navbar'
import BottomNavBar from '../components/BottomNavBar'
import JobCard from '../components/JobCard'
import RateJobModal from '../components/RateJobModal'
import StarRating from '../components/StarRating'
import Layout from '../components/Layout'
import { JobCardSkeleton } from '../components/Skeleton'
import { queryKeys } from '../queryKeys'

const FILTERS = ['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

export default function FarmerHistory() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('ALL')
  const [rateModal, setRateModal] = useState(null)

  const { data: jobs = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.history.farmer,
    staleTime: 30_000,
    queryFn: async () => {
      const res = await api.get('/history/farmer')
      return unwrap(res) || []
    },
  })

  const filtered = filter === 'ALL' ? jobs : jobs.filter((j) => j.status === filter)
  const completed = jobs.filter((j) => j.status === 'COMPLETED')
  const totalSpent = completed.reduce(
    (sum, j) => sum + (j.wagePerDay || 0) * (j.acceptedCount || 0),
    0
  )

  return (
    <Layout>
      <Navbar />
      <div className="px-3 py-6 sm:px-4">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-amber-500/8 via-slate-950 to-slate-950 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.15),transparent_30%)]" />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/80">Work Analytics</p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl">{t('workHistory')}</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-300">View your job history, spending, and performance metrics.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Total Jobs</p>
            <p className="mt-3 text-3xl font-bold text-amber-400">{jobs.length}</p>
            <p className="mt-1 text-xs text-slate-400">Posted lifetime</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Completed</p>
            <p className="mt-3 text-3xl font-bold text-emerald-400">{completed.length}</p>
            <p className="mt-1 text-xs text-slate-400">Successfully closed</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Total Spent</p>
            <p className="mt-3 text-3xl font-bold text-cyan-400">₹{totalSpent.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-400">On wages paid</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                filter === f
                  ? 'border-amber-400/50 bg-amber-500/15 text-amber-200 shadow-[0_0_12px_rgba(217,119,6,0.25)]'
                  : 'border-white/10 bg-slate-900/40 text-slate-300 hover:border-white/20 hover:bg-slate-900/60'
              }`}
            >
              {f === 'ALL' ? t('all') : t(f === 'IN_PROGRESS' ? 'ongoing' : f.toLowerCase())}
            </button>
          ))}
        </div>

        {/* Jobs List */}
        <div className="mt-6">
          {loading ? (
            <div className="space-y-3">
              <JobCardSkeleton />
              <JobCardSkeleton />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-10 text-center">
              <span className="text-5xl">📭</span>
              <p className="mt-4 text-lg font-semibold text-slate-200">No jobs found</p>
              <p className="mt-2 text-sm text-slate-400">Try adjusting your filter to see more jobs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((job) => (
                <div key={job.id} className="space-y-2">
                  <JobCard job={job} isOwner={true} />
                  {job.status === 'COMPLETED' && !job.ratedByCurrentUser && (
                    <button
                      onClick={() => {
                        console.log('Give Review clicked for job:', job.id);
                        console.log('Job applicants:', job.applicants);
                        const acceptedApplicant = job.applicants?.find((a) => a.status === 'ACCEPTED')
                        console.log('Accepted applicant:', acceptedApplicant);
                        if (acceptedApplicant) {
                          setRateModal({
                            job,
                            rateeId: acceptedApplicant.labourerId,
                            rateeName: acceptedApplicant.name,
                            onSubmit: async ({ rating, comment }) => {
                              await api.post('/ratings', {
                                jobId: job.id,
                                rateeId: acceptedApplicant.labourerId,
                                stars: rating,
                                comment,
                              }, { suppressErrorToast: true })
                            },
                          })
                        } else {
                          console.log('No accepted applicant found');
                        }
                      }}
                      className="w-full rounded-lg border border-emerald-400/30 bg-emerald-500/12 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
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
          onSuccess={async () => {
            setRateModal(null)
            await queryClient.invalidateQueries({ queryKey: queryKeys.history.farmer })
          }}
        />
      )}
    </Layout>
  )
}

export function LabourHistoryPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [rateModal, setRateModal] = useState(null)

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: queryKeys.history.labourer,
    staleTime: 30_000,
    queryFn: async () => {
      const res = await api.get('/history/labourer')
      return unwrap(res) || []
    },
    enabled: !!user?.id,
  })

  const { data: ratings = [], isLoading: ratingsLoading } = useQuery({
    queryKey: queryKeys.history.ratings(user?.id),
    staleTime: 30_000,
    queryFn: async () => {
      const res = await api.get(`/users/${user.id}/ratings`)
      return unwrap(res) || []
    },
    enabled: !!user?.id,
  })

  const loading = jobsLoading || ratingsLoading

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
      <div className="px-3 py-6 sm:px-4">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/8 via-slate-950 to-slate-950 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_30%)]" />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">Career Stats</p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl">{t('workHistory')}</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-300">Track your earnings, completed jobs, and performance ratings.</p>
          </div>
        </div>

        {/* Stats Grid - 2x2 for Labourer */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Total Jobs</p>
            <p className="mt-3 text-3xl font-bold text-cyan-400">{jobs.length}</p>
            <p className="mt-1 text-xs text-slate-400">Completed</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Total Earned</p>
            <p className="mt-3 text-3xl font-bold text-emerald-400">₹{totalEarned.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-400">Lifetime earnings</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Average Rating</p>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-3xl font-bold text-amber-400">{avgRating}</p>
              <span className="text-xs text-slate-400">/ 5.0</span>
            </div>
            {ratings.length > 0 && <p className="mt-1 text-xs text-slate-400">{ratings.length} reviews</p>}
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">This Month</p>
            <p className="mt-3 text-3xl font-bold text-cyan-400">₹{monthEarnings.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-400">Current month earnings</p>
          </div>
        </div>

        {/* Jobs List */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold tracking-[-0.05em] text-white">{t('completedJobs')}</h2>
          <p className="mt-1 text-sm text-slate-400">Your job history and work records</p>

          <div className="mt-4">
            {loading ? (
              <div className="space-y-3">
                <JobCardSkeleton />
                <JobCardSkeleton />
              </div>
            ) : jobs.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-10 text-center">
                <span className="text-5xl">🌾</span>
                <p className="mt-4 text-lg font-semibold text-slate-200">No work history yet</p>
                <p className="mt-2 text-sm text-slate-400">Complete jobs to build your work history and earn reviews</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div key={job.id} className="rounded-xl border border-white/10 bg-slate-900/40 p-4 sm:p-5 hover:border-white/20 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{job.title}</h3>
                        <p className="mt-1 text-sm text-slate-300">
                          Worked with <span className="font-medium">{job.farmerName}</span> on {job.workDate}
                        </p>
                        {job.ratingReceived && (
                          <div className="mt-2 flex items-center gap-2">
                            <StarRating value={job.ratingReceived} size="sm" />
                            <span className="text-xs text-slate-400">Rating received</span>
                          </div>
                        )}
                        {job.status === 'COMPLETED' && !job.ratedByCurrentUser && (
                          <button
                            onClick={() => setRateModal({
                              job,
                              rateeId: job.farmerId,
                              rateeName: job.farmerName,
                              onSubmit: async ({ rating, comment }) => {
                                await api.post('/ratings', { jobId: job.id, rateeId: job.farmerId, stars: rating, comment }, { suppressErrorToast: true })
                              },
                            })}
                            className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-500/12 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
                          >
                            ⭐ Give Review
                          </button>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-2xl font-bold text-emerald-400">₹{job.wagePerDay}</p>
                        <p className="text-xs text-slate-400">earned</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
      <BottomNavBar />

      {rateModal && (
        <RateJobModal
          job={rateModal.job}
          rateeId={rateModal.rateeId}
          rateeName={rateModal.rateeName}
          onClose={() => setRateModal(null)}
          onSuccess={() => {
            setRateModal(null)
            // Refresh ratings query
          }}
        />
      )}
    </Layout>
  )
}
