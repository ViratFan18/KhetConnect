import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { VariableSizeList } from 'react-window'
import api, { unwrap, getApiErrorMessage } from '../services/api'
import Navbar from '../components/Navbar'
import BottomNavBar from '../components/BottomNavBar'
import JobCard from '../components/JobCard'
import RateJobModal from '../components/RateJobModal'
import StarRating from '../components/StarRating'
import Layout, { Button, PrimaryButton } from '../components/Layout'
import { JobCardSkeleton } from '../components/Skeleton'
import { queryKeys } from '../queryKeys'

export default function MyJobs() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(null)
  const [applicants, setApplicants] = useState({})
  const [rateModal, setRateModal] = useState(null)
  const listRef = useRef(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: queryKeys.jobs.myPosts,
    staleTime: 30_000,
    initialPageParam: '0',
    queryFn: async ({ pageParam = '0' }) => {
      const res = await api.get('/jobs/my-posts', { params: { cursor: pageParam, pageSize: 20 } })
      return unwrap(res) || { items: [], nextCursor: null }
    },
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
  })

  const jobs = useMemo(() => data?.pages.flatMap((page) => page.items || []) ?? [], [data])

  useEffect(() => {
    listRef.current?.resetAfterIndex(0)
  }, [expanded])

  const toggleExpand = async (jobId) => {
    if (expanded === jobId) {
      setExpanded(null)
      return
    }
    setExpanded(jobId)
    if (!applicants[jobId]) {
      try {
        const res = await api.get(`/jobs/${jobId}/applicants`, { suppressErrorToast: true })
        setApplicants((prev) => ({ ...prev, [jobId]: unwrap(res) || [] }))
      } catch (err) {
        toast.error(getApiErrorMessage(err, t('error')))
      }
    }
  }

  const acceptMutation = useMutation({
    mutationFn: async ({ jobId, labourerId, labourerName }) => {
      const res = await api.put(`/jobs/${jobId}/accept/${labourerId}`, null, { suppressErrorToast: true })
      return { result: unwrap(res), labourerName }
    },
    onSuccess: async ({ result: updatedJob, labourerName }, variables) => {
      queryClient.setQueryData(queryKeys.jobs.myPosts, (prev = []) =>
        prev.map((job) => (job.id === variables.jobId ? { ...job, ...updatedJob } : job))
      )
      setApplicants((prev) => ({ ...prev, [variables.jobId]: updatedJob.applicants || prev[variables.jobId] || [] }))
      await queryClient.invalidateQueries({ queryKey: queryKeys.jobs.myPosts })
      toast.success(`✓ You hired ${labourerName}`)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not hire this worker')),
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ jobId, labourerId, labourerName }) => {
      const res = await api.put(`/jobs/${jobId}/reject/${labourerId}`, null, { suppressErrorToast: true })
      return { result: unwrap(res), labourerName }
    },
    onSuccess: async ({ result: updatedJob, labourerName }, variables) => {
      queryClient.setQueryData(queryKeys.jobs.myPosts, (prev = []) =>
        prev.map((job) => (job.id === variables.jobId ? { ...job, ...updatedJob } : job))
      )
      setApplicants((prev) => ({ ...prev, [variables.jobId]: updatedJob.applicants || prev[variables.jobId] || [] }))
      await queryClient.invalidateQueries({ queryKey: queryKeys.jobs.myPosts })
      toast.success(`✓ You declined ${labourerName}`)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not decline this application')),
  })

  const completeMutation = useMutation({
    mutationFn: async ({ jobId }) => {
      const res = await api.put(`/jobs/${jobId}/complete`, null, { suppressErrorToast: true })
      return unwrap(res)
    },
    onSuccess: async (updatedJob, variables) => {
      queryClient.setQueryData(queryKeys.jobs.myPosts, (prev = []) =>
        prev.map((job) => (job.id === variables.jobId ? { ...job, ...updatedJob } : job))
      )
      setApplicants((prev) => ({ ...prev, [variables.jobId]: updatedJob.applicants || prev[variables.jobId] || [] }))
      await queryClient.invalidateQueries({ queryKey: queryKeys.jobs.myPosts })
      toast.success('✓ Job marked complete')

      const accepted = updatedJob.applicants?.find((a) => a.status === 'ACCEPTED')
      if (accepted) {
        setRateModal({
          job: updatedJob,
          rateeId: accepted.labourerId,
          rateeName: accepted.name,
          onSubmit: async ({ rating, comment }) => {
            await api.post('/ratings', { jobId: variables.jobId, rateeId: accepted.labourerId, stars: rating, comment }, { suppressErrorToast: true })
          },
        })
      }
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not complete this job')),
  })

  const acceptLabourer = async (jobId, labourerId, labourerName) => {
    if (!window.confirm(`Hire ${labourerName}?`)) return
    acceptMutation.mutate({ jobId, labourerId, labourerName })
  }
  const rejectLabourer = async (jobId, labourerId, labourerName) => {
    if (!window.confirm(`Decline ${labourerName}?`)) return
    rejectMutation.mutate({ jobId, labourerId, labourerName })
  }
  const completeJob = async (jobId) => {
    if (!window.confirm('Mark this job as complete? You will be able to rate the worker(s).')) return
    if (rateModal) return
    completeMutation.mutate({ jobId })
  }

  return (
    <Layout>
      <Navbar />
      <div className="px-3 py-6 sm:px-4">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-amber-500/8 via-slate-950 to-slate-950 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.15),transparent_30%)]" />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/80">{t('farmManagement')}</p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl">{t('myJobs')}</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-300">Manage your posted jobs, review applications, and track progress.</p>
          </div>
        </div>

        {/* Jobs List */}
        <div className="mt-8">
          {isLoading ? (
            <div className="space-y-3">
              <JobCardSkeleton />
              <JobCardSkeleton />
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-10 text-center">
              <span className="text-5xl">📋</span>
              <p className="mt-4 text-lg font-semibold text-slate-200">No jobs posted yet</p>
              <p className="mt-2 text-sm text-slate-400">Start by posting your first job to hire labourers</p>
              <Link to="/post-job" className="mt-6 inline-block">
                <button className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 font-semibold text-white shadow-[0_12px_30px_-8px_rgba(217,119,6,0.4)] hover:shadow-[0_16px_40px_-10px_rgba(217,119,6,0.5)] transition">
                  ✨ Post Your First Job
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id}>
                  <JobCard job={job} isOwner={true} />
                  
                  {/* Expandable Applicants Section */}
                  {expanded === job.id && applicants[job.id] && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Applicants ({applicants[job.id].length})
                      </h3>
                      {applicants[job.id].length === 0 ? (
                        <p className="text-slate-400 text-center py-4">No applications yet</p>
                      ) : (
                        <div className="space-y-3">
                          {applicants[job.id].map((a) => (
                            <div key={a.applicationId} className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/50 p-4">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-white">{a.name}</p>
                                <div className="mt-1 flex items-center gap-2">
                                  <StarRating value={Number(a.ratingAvg)} size="sm" />
                                  <span className="text-xs text-slate-500">({a.ratingAvg}/5)</span>
                                </div>
                                {a.skills && <p className="mt-1 text-xs text-slate-400">{a.skills}</p>}
                              </div>
                              <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                                a.status === 'ACCEPTED' ? 'border border-emerald-400/30 bg-emerald-500/12 text-emerald-200' :
                                a.status === 'REJECTED' ? 'border border-rose-400/30 bg-rose-500/12 text-rose-200' :
                                'border border-amber-400/30 bg-amber-500/12 text-amber-200'
                              }`}>
                                {t(a.status.toLowerCase())}
                              </span>
                              
                              {a.status === 'PENDING' && (
                                <div className="shrink-0 flex flex-col gap-1.5">
                                  <button
                                    onClick={() => acceptLabourer(job.id, a.labourerId, a.name)}
                                    disabled={acceptMutation.isPending}
                                    className="px-2 py-1 rounded text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-60"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => rejectLabourer(job.id, a.labourerId, a.name)}
                                    disabled={rejectMutation.isPending}
                                    className="px-2 py-1 rounded text-xs font-semibold border border-rose-400/30 bg-rose-500/12 text-rose-200 hover:bg-rose-500/20 transition disabled:opacity-60"
                                  >
                                    ✗
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {job.status === 'IN_PROGRESS' && (
                        <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                          <button
                            onClick={() => completeJob(job.id)}
                            disabled={completeMutation.isPending}
                            className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60"
                          >
                            ✓ Mark Complete
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleExpand(job.id)}
                    className="mt-2 w-full text-center px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition"
                  >
                    {expanded === job.id ? '↑ Hide Applicants' : '↓ View Applicants'}
                  </button>
                </div>
              ))}
              
              {hasNextPage && (
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-full mt-4 px-4 py-3 rounded-lg border border-white/10 bg-slate-900/40 font-semibold text-white hover:bg-slate-900/60 transition disabled:opacity-60"
                >
                  {isFetchingNextPage ? '⏳ Loading...' : '📥 Load More'}
                </button>
              )}
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
