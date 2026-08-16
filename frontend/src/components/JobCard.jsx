import React, { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import api, { getApiErrorMessage, unwrap } from '../services/api'
import useAuthStore from '../store/authStore'
import StarRating from './StarRating'

const statusColors = {
  OPEN: 'border-[var(--kc-glow-gold)]/20 bg-amber-400/10 text-amber-300',
  IN_PROGRESS: 'border-teal-400/20 bg-teal-400/10 text-teal-300',
  COMPLETED: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  CANCELLED: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
}

const workTypeColors = {
  HARVESTING: 'border-[var(--kc-glow-gold)]/20 bg-amber-400/10 text-amber-300',
  PLANTING: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  IRRIGATION: 'border-teal-400/20 bg-teal-400/10 text-teal-300',
  SPRAYING: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  WEEDING: 'border-[var(--kc-glow-gold)]/20 bg-amber-400/10 text-amber-300',
  OTHER: 'border-white/10 bg-white/5 text-[var(--kc-text-secondary)]',
}

const JobCard = memo(function JobCard({ job, onClick, onApplySuccess, onApplyMutation }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(Boolean(job?.myApplicationStatus))

  const applyMutation = onApplyMutation || {
    mutateAsync: async ({ jobId }) => {
      const res = await api.post(`/jobs/${jobId}/apply`, null, { suppressErrorToast: true })
      return unwrap(res)
    },
  }

  const pulseMap = {
    OPEN: 'pulse-pending',
    IN_PROGRESS: 'pulse-active',
    COMPLETED: 'pulse-still',
    CANCELLED: 'pulse-still',
  }
  const pulseClass = pulseMap[job?.status] || 'pulse-still'

  const handleOpen = () => {
    if (onClick) onClick(job)
    else navigate(`/jobs/${job.id}`)
  }

  const handleCardKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleOpen()
    }
  }

  const handleQuickApply = async (event) => {
    event.stopPropagation()
    if (applied || applying || !job?.id || user?.role !== 'LABOURER') return

    const previousApplied = applied
    setApplying(true)
    setApplied(true)

    try {
      const updated = await applyMutation.mutateAsync ? applyMutation.mutateAsync({ jobId: job.id }) : await api.post(`/jobs/${job.id}/apply`, null, { suppressErrorToast: true })
      const responseData = updated && typeof updated === 'object' && 'data' in updated ? updated.data : updated
      const payload = responseData?.data ?? responseData ?? {}
      onApplySuccess?.(payload)
      toast.success(t('applied'))
    } catch (err) {
      setApplied(previousApplied)
      toast.error(getApiErrorMessage(err, t('error')))
    } finally {
      setApplying(false)
    }
  }

  const farmerImage = job?.farmerPhotoUrl || job?.farmerImageUrl || job?.farmerAvatarUrl || job?.photoUrl

  return (
    <div className={`relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900/50 p-5 sm:p-6 transition-all duration-200 hover:border-white/20 hover:bg-slate-900/70 ${pulseClass}`}>
      <div
        role="link"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={handleCardKeyDown}
        className="w-full cursor-pointer text-left outline-none"
      >
        {/* Header: Title + Status */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold tracking-[-0.02em] text-white te-text line-clamp-2">{job.title}</h3>
            {job.workType && (
              <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${workTypeColors[job.workType]}`}>
                {t(job.workType.toLowerCase())}
              </span>
            )}
          </div>
          {job.status && (
            <span className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] ${statusColors[job.status]}`}>
              {t(job.status === 'IN_PROGRESS' ? 'inProgress' : job.status.toLowerCase())}
            </span>
          )}
        </div>

        {/* Wage & Time */}
        <div className="mb-5 rounded-xl border border-white/10 bg-slate-950/80 p-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-cyan-400">₹{job.wagePerDay}</span>
            <span className="text-sm text-slate-400">/ day</span>
          </div>
          {job.workDate && <p className="mt-2 text-xs text-slate-400">📅 {job.workDate}</p>}
        </div>

        {/* Details Grid */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          {job.village && (
            <div className="rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2">
              <p className="text-xs text-slate-400">📍 Location</p>
              <p className="mt-1 text-sm font-semibold text-slate-200 truncate">{job.village}</p>
            </div>
          )}
          {job.distanceKm != null && (
            <div className="rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2">
              <p className="text-xs text-slate-400">Distance</p>
              <p className="mt-1 text-sm font-semibold text-slate-200">{job.distanceKm.toFixed(1)} km</p>
            </div>
          )}
        </div>

        {/* Farmer Card */}
        {job.farmerName && (
          <div className="mb-4 rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/8 to-transparent p-3">
            <div className="flex items-center gap-3">
              {farmerImage ? (
                <img
                  src={farmerImage}
                  alt={job.farmerName}
                  loading="lazy"
                  className="h-10 w-10 rounded-lg object-cover ring-1 ring-cyan-400/30"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 font-semibold">
                  {job.farmerName?.charAt(0)?.toUpperCase()}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-100 text-sm truncate">{job.farmerName}</p>
                {job.farmerRating > 0 && (
                  <div className="mt-1 flex items-center gap-1">
                    <StarRating value={Number(job.farmerRating)} size="sm" />
                    <span className="text-xs text-slate-400">({job.farmerRating.toFixed(1)})</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Application Count */}
        {job.pendingCount != null && job.pendingCount > 0 ? (
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-slate-300">{job.acceptedCount}</span> accepted • <span className="font-semibold text-slate-300">{job.pendingCount}</span> pending
          </p>
        ) : job.acceptedCount != null ? (
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-slate-300">{job.acceptedCount}</span> hired
          </p>
        ) : null}
      </div>

      {/* Apply Button - Labourer Only */}
      {user?.role === 'LABOURER' && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={handleQuickApply}
            disabled={applied || applying}
            className={`w-full rounded-lg px-4 py-3 font-semibold transition ${
              applied
                ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 cursor-default'
                : 'border border-cyan-400/30 bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-200 hover:border-cyan-400/50 hover:bg-gradient-to-r hover:from-cyan-500/30 hover:to-transparent'
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {applying ? '⏳ Applying...' : applied ? '✓ Applied' : '🎯 Quick Apply'}
          </button>
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  const prevJob = prevProps.job
  const nextJob = nextProps.job

  return prevProps.onClick === nextProps.onClick &&
    prevProps.onApplySuccess === nextProps.onApplySuccess &&
    prevProps.onApplyMutation === nextProps.onApplyMutation &&
    prevJob?.id === nextJob?.id &&
    prevJob?.status === nextJob?.status &&
    prevJob?.myApplicationStatus === nextJob?.myApplicationStatus &&
    prevJob?.distanceKm === nextJob?.distanceKm &&
    prevJob?.acceptedCount === nextJob?.acceptedCount &&
    prevJob?.pendingCount === nextJob?.pendingCount &&
    prevJob?.farmerRating === nextJob?.farmerRating
})

export default JobCard
