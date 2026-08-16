import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import api, { getApiErrorMessage, unwrap } from '../services/api'
import useAuthStore from '../store/authStore'
import Navbar from '../components/Navbar'
import BottomNavBar from '../components/BottomNavBar'
import StarRating from '../components/StarRating'
import RateJobModal from '../components/RateJobModal'
import Layout, { Button, PrimaryButton } from '../components/Layout'

export default function JobDetail() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [actionError, setActionError] = useState('')
  const [rateModal, setRateModal] = useState(null)

  const isFarmer = user?.role === 'FARMER'
  const isOwner = job?.farmerId === user?.id

  const loadJob = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await api.get(`/jobs/${id}`, { suppressErrorToast: true })
      setJob(unwrap(res))
    } catch {
      toast.error(t('error'))
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }, [id, navigate, t])

  useEffect(() => {
    loadJob()
  }, [loadJob])

  const apply = async () => {
    setApplying(true)
    setActionError('')
    try {
      const res = await api.post(`/jobs/${id}/apply`, null, { suppressErrorToast: true })
      const updatedJob = unwrap(res)
      setJob((prev) => ({ ...(prev || {}), ...updatedJob, myApplicationStatus: 'PENDING' }))
      toast.success('✓ Application sent. Wait for the farmer to respond.')
    } catch (err) {
      const message = getApiErrorMessage(err, 'Could not apply for this job')
      setActionError(message)
      toast.error(message)
    } finally {
      setApplying(false)
    }
  }

  const acceptLabourer = async (labourerId) => {
    const applicant = job?.applicants?.find((a) => a.labourerId === labourerId)
    if (!window.confirm(`Hire ${applicant?.name}?`)) return
    
    setPendingAction({ type: 'accept', labourerId })
    setActionError('')
    try {
      const res = await api.put(`/jobs/${id}/accept/${labourerId}`, null, { suppressErrorToast: true })
      const updatedJob = unwrap(res)
      setJob((prev) => ({ ...(prev || {}), ...updatedJob }))
      toast.success(`✓ You hired ${applicant?.name}`)
    } catch (err) {
      const message = getApiErrorMessage(err, 'Could not hire this worker')
      setActionError(message)
      toast.error(message)
    } finally {
      setPendingAction(null)
    }
  }

  const rejectLabourer = async (labourerId) => {
    const applicant = job?.applicants?.find((a) => a.labourerId === labourerId)
    if (!window.confirm(`Decline ${applicant?.name}?`)) return
    
    setPendingAction({ type: 'reject', labourerId })
    setActionError('')
    try {
      const res = await api.put(`/jobs/${id}/reject/${labourerId}`, null, { suppressErrorToast: true })
      const updatedJob = unwrap(res)
      setJob((prev) => ({ ...(prev || {}), ...updatedJob }))
      toast.success(`✓ You declined ${applicant?.name}`)
    } catch (err) {
      const message = getApiErrorMessage(err, 'Could not decline this application')
      setActionError(message)
      toast.error(message)
    } finally {
      setPendingAction(null)
    }
  }

  const completeJob = async () => {
    if (!window.confirm('Mark this job as complete? You will be able to rate the worker(s).')) return
    if (rateModal) return
    setPendingAction({ type: 'complete' })
    setActionError('')
    try {
      const res = await api.put(`/jobs/${id}/complete`, null, { suppressErrorToast: true })
      const updatedJob = unwrap(res)
      setJob((prev) => ({ ...(prev || {}), ...updatedJob }))
      toast.success('✓ Job marked complete')
      const accepted = updatedJob.applicants?.find((a) => a.status === 'ACCEPTED')
      if (accepted) {
        setRateModal({
          job: updatedJob,
          rateeId: accepted.labourerId,
          rateeName: accepted.name,
          onSubmit: async ({ rating, comment }) => {
            await api.post('/ratings', { jobId: updatedJob.id, rateeId: accepted.labourerId, stars: rating, comment }, { suppressErrorToast: true })
          },
        })
      }
    } catch (err) {
      const message = getApiErrorMessage(err, 'Could not complete this job')
      setActionError(message)
      toast.error(message)
    } finally {
      setPendingAction(null)
    }
  }

  const callContact = async () => {
    if (!job?.farmerId) return

    try {
      const res = await api.get(`/users/${job.farmerId}/contact`, { suppressErrorToast: true })
      const contact = unwrap(res)

      if (!contact?.canCall || !contact?.phone) {
        toast.error('You are not allowed to contact this user yet.')
        return
      }

      await api.post('/calls/log', { receiverId: job.farmerId, jobId: job.id }, { suppressErrorToast: true })
      window.location.href = `tel:${contact.phone}`
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to start the call right now.')
      toast.error(message)
    }
  }

  const cancelJob = async () => {
    if (!window.confirm('Cancel this job? Applicants will be notified.')) return
    setPendingAction({ type: 'cancel' })
    setActionError('')
    try {
      const res = await api.put(`/jobs/${id}/cancel`, null, { suppressErrorToast: true })
      const updatedJob = unwrap(res)
      setJob((prev) => ({ ...(prev || {}), ...updatedJob }))
      toast.success('✓ Job cancelled')
    } catch (err) {
      const message = getApiErrorMessage(err, 'Could not cancel this job')
      setActionError(message)
      toast.error(message)
    } finally {
      setPendingAction(null)
    }
  }

  const withdrawAcceptedOffer = async () => {
    if (!window.confirm('Withdraw your acceptance? You will no longer be hired for this job.')) return
    setPendingAction({ type: 'withdraw' })
    setActionError('')
    try {
      const res = await api.put(`/jobs/${id}/withdraw`, null, { suppressErrorToast: true })
      const updatedJob = unwrap(res)
      setJob((prev) => ({ ...(prev || {}), ...updatedJob, myApplicationStatus: 'REJECTED' }))
      toast.success('✓ Withdrawn')
    } catch (err) {
      const message = getApiErrorMessage(err, 'Could not withdraw your offer')
      setActionError(message)
      toast.error(message)
    } finally {
      setPendingAction(null)
    }
  }

  if (loading) {
    return (
      <Layout>
        <Navbar />
        <div className="px-3 py-8 sm:px-4 text-center text-slate-300">{t('loading')}</div>
      </Layout>
    )
  }

  if (!job) return null

  const statusColors = {
    OPEN: { bg: 'bg-emerald-500/12', text: 'text-emerald-200', border: 'border-emerald-400/30' },
    IN_PROGRESS: { bg: 'bg-amber-500/12', text: 'text-amber-200', border: 'border-amber-400/30' },
    COMPLETED: { bg: 'bg-slate-500/12', text: 'text-slate-200', border: 'border-slate-400/30' },
    CANCELLED: { bg: 'bg-rose-500/12', text: 'text-rose-200', border: 'border-rose-400/30' },
  }

  const isFull = job.acceptedCount >= job.workersNeeded
  const backPath = isFarmer ? '/my-jobs' : '/nearby-jobs'
  const statusColor = statusColors[job.status] || statusColors.OPEN

  return (
    <Layout>
      <Navbar />
      <div className="px-3 py-6 sm:px-4">
        <button type="button" onClick={() => navigate(backPath)} className="mb-6 text-sm font-semibold text-slate-400 hover:text-slate-200 transition">
          ← {t('back')}
        </button>

        {/* Job Hero Section */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-500/8 via-slate-950 to-slate-950 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.15),transparent_30%)]" />
          <div className="relative z-10">
            <div className="mb-4 flex items-center gap-3">
              <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 ${statusColor.border} ${statusColor.bg}`}>
                <span className="h-2 w-2 rounded-full bg-current"></span>
                <span className={`text-sm font-semibold ${statusColor.text}`}>{t(job.status.toLowerCase())}</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl">{job.title}</h1>
            <p className="mt-2 text-lg text-slate-300">{t(job.workType?.toLowerCase())} · {job.cropType}</p>
            
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/12 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Daily Wage</p>
                <p className="mt-2 text-3xl font-bold text-cyan-400">₹{job.wagePerDay}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Workers Needed</p>
                <p className="mt-2 text-3xl font-bold text-white">{job.workersNeeded}</p>
                <p className="mt-1 text-xs text-slate-400">{job.acceptedCount} accepted</p>
              </div>
            </div>

            <div className="mt-6 space-y-2 text-slate-300">
              <p className="flex items-center gap-2">📅 <span>{job.workDate}</span></p>
              <p className="flex items-center gap-2">📍 <span>{job.village}</span></p>
              {job.distanceKm != null && <p className="flex items-center gap-2">📐 <span>{job.distanceKm.toFixed(1)} km away</span></p>}
            </div>
            {job.description && <p className="mt-4 text-base text-slate-300">{job.description}</p>}
          </div>
        </div>

        {/* Farmer Card */}
        <div className="mt-8 rounded-xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Posted by</p>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-white">{job.farmerName}</p>
              <div className="mt-2 flex items-center gap-2">
                <StarRating value={Number(job.farmerRating)} size="sm" />
                <span className="text-sm text-slate-400">({job.farmerRatingCount} reviews)</span>
              </div>
            </div>
            {(job.farmerPhone || user?.role === 'LABOURER') && (
              <button
                type="button"
                onClick={callContact}
                className="rounded-lg border border-cyan-400/30 bg-cyan-500/12 px-4 py-2.5 font-semibold text-cyan-200 hover:bg-cyan-500/20 transition"
              >
                📞 Call
              </button>
            )}
          </div>
        </div>

        {/* Labourer Actions */}
        {!isFarmer && (
          <div className="mt-8 space-y-3">
            {job.myApplicationStatus === 'ACCEPTED' ? (
              <>
                <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/12 px-4 py-3 text-center">
                  <p className="text-sm font-semibold text-emerald-200">✓ You're accepted for this job!</p>
                </div>
                <button
                  onClick={withdrawAcceptedOffer}
                  disabled={pendingAction !== null}
                  className="w-full rounded-lg border border-rose-400/30 bg-rose-500/12 px-6 py-3 font-semibold text-rose-200 hover:bg-rose-500/20 transition disabled:opacity-60"
                >
                  {pendingAction?.type === 'withdraw' ? '⏳ Cancelling...' : 'Cancel Acceptance'}
                </button>
              </>
            ) : job.myApplicationStatus === 'REJECTED' ? (
              <div className="rounded-lg border border-rose-400/30 bg-rose-500/12 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-rose-200">✗ Your application was rejected</p>
              </div>
            ) : job.myApplicationStatus === 'PENDING' ? (
              <div className="rounded-lg border border-amber-400/30 bg-amber-500/12 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-amber-200">⏳ Your application is pending</p>
              </div>
            ) : isFull ? (
              <div className="rounded-lg border border-white/10 bg-slate-900/40 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-slate-300">This job is now full</p>
              </div>
            ) : (
              <button
                onClick={apply}
                disabled={applying}
                className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-3.5 font-semibold text-white shadow-[0_12px_30px_-8px_rgba(34,211,238,0.4)] hover:shadow-[0_16px_40px_-10px_rgba(34,211,238,0.5)] transition disabled:opacity-60"
              >
                {applying ? '⏳ Applying...' : '✨ Apply for Job'}
              </button>
            )}
            {actionError && <p className="text-sm text-rose-300">⚠️ {actionError}</p>}
          </div>
        )}

        {/* Applicants List (Farmer only) */}
        {isOwner && job.applicants?.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold tracking-[-0.05em] text-white">{t('applicants')}</h2>
            <p className="mt-1 text-sm text-slate-400">{job.applicants.length} labourers have applied</p>
            <div className="mt-4 space-y-3">
              {job.applicants.map((a) => (
                <div key={a.applicationId} className="rounded-xl border border-white/10 bg-slate-900/40 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-white">{a.name}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <StarRating value={Number(a.ratingAvg)} size="sm" />
                        <span className="text-sm text-slate-400">({a.ratingAvg}/5)</span>
                      </div>
                      {a.skills && <p className="mt-1 text-sm text-slate-300">Skills: {a.skills}</p>}
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      a.status === 'ACCEPTED' ? 'border border-emerald-400/30 bg-emerald-500/12 text-emerald-200' :
                      a.status === 'REJECTED' ? 'border border-rose-400/30 bg-rose-500/12 text-rose-200' :
                      'border border-amber-400/30 bg-amber-500/12 text-amber-200'
                    }`}>
                      {t(a.status.toLowerCase())}
                    </span>
                  </div>
                  {a.status === 'PENDING' && !isFull && (
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={() => acceptLabourer(a.labourerId)}
                        disabled={pendingAction !== null}
                        className="flex-1 rounded-lg bg-emerald-600 px-3 py-2.5 font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60"
                      >
                        {pendingAction?.type === 'accept' && pendingAction.labourerId === a.labourerId ? '⏳ Accepting...' : '✓ Accept'}
                      </button>
                      <button
                        onClick={() => rejectLabourer(a.labourerId)}
                        disabled={pendingAction !== null}
                        className="flex-1 rounded-lg border border-rose-400/30 bg-rose-500/12 px-3 py-2.5 font-semibold text-rose-200 hover:bg-rose-500/20 transition disabled:opacity-60"
                      >
                        {pendingAction?.type === 'reject' && pendingAction.labourerId === a.labourerId ? '⏳ Rejecting...' : '✗ Reject'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Farmer Job Actions */}
        {isOwner && (job.status === 'OPEN' || job.status === 'IN_PROGRESS') && (
          <div className="mt-10 space-y-3">
            {actionError && <p className="text-sm text-rose-300">⚠️ {actionError}</p>}
            {job.status === 'IN_PROGRESS' && (
              <button
                onClick={completeJob}
                disabled={pendingAction !== null}
                className="w-full rounded-lg bg-emerald-600 px-6 py-3.5 font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60"
              >
                {pendingAction?.type === 'complete' ? '⏳ Completing...' : '✓ Mark Job Complete'}
              </button>
            )}
            <button
              onClick={cancelJob}
              disabled={pendingAction !== null}
              className="w-full rounded-lg border border-rose-400/30 bg-rose-500/12 px-6 py-3.5 font-semibold text-rose-200 hover:bg-rose-500/20 transition disabled:opacity-60"
            >
              {pendingAction?.type === 'cancel' ? '⏳ Cancelling...' : '✗ Cancel Job'}
            </button>
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
          onSuccess={() => setRateModal(null)}
        />
      )}
    </Layout>
  )
}
