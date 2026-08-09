import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import api, { getApiErrorMessage, unwrap } from '../services/api'
import useAuthStore from '../store/authStore'
import StarRating from './StarRating'

const statusColors = {
  OPEN: 'bg-amber-400/15 text-amber-300',
  IN_PROGRESS: 'bg-cyan-400/15 text-cyan-300',
  COMPLETED: 'bg-emerald-400/15 text-emerald-300',
  CANCELLED: 'bg-rose-400/15 text-rose-300',
}

const workTypeColors = {
  HARVESTING: 'bg-amber-400/15 text-amber-300',
  PLANTING: 'bg-emerald-400/15 text-emerald-300',
  IRRIGATION: 'bg-cyan-400/15 text-cyan-300',
  SPRAYING: 'bg-violet-400/15 text-violet-300',
  WEEDING: 'bg-orange-400/15 text-orange-300',
  OTHER: 'bg-slate-700 text-slate-200',
}

export default function JobCard({ job, onClick, onApplySuccess }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(Boolean(job?.myApplicationStatus))

  const handleOpen = () => {
    if (onClick) onClick(job)
    else navigate(`/jobs/${job.id}`)
  }

  const handleQuickApply = async (event) => {
    event.stopPropagation()
    if (applied || applying || !job?.id || user?.role !== 'LABOURER') return

    setApplying(true)
    try {
      const res = await api.post(`/jobs/${job.id}/apply`)
      const updated = unwrap(res) || res
      setApplied(true)
      onApplySuccess?.(updated)
      toast.success(t('applied'))
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('error')))
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="glass-card glass-panel overflow-hidden rounded-[30px] border border-white/10 bg-slate-900/80 p-5 shadow-[0_24px_80px_-30px_rgba(0,0,0,0.95)]">
      <button type="button" onClick={handleOpen} className="w-full text-left">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-white">{job.title}</h3>
            {job.workType && (
              <span className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold ${workTypeColors[job.workType]}`}>
                {t(job.workType.toLowerCase())}
              </span>
            )}
          </div>
          {job.status && (
            <span className={`shrink-0 rounded-full border border-white/10 bg-slate-950/80 px-3 py-1.5 text-[11px] font-semibold ${statusColors[job.status]}`}>
              {t(job.status === 'IN_PROGRESS' ? 'inProgress' : job.status.toLowerCase())}
            </span>
          )}
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="rounded-full bg-slate-950/80 px-4 py-3 text-3xl font-bold tracking-tight text-cyan-300 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.1)]">₹{job.wagePerDay}</div>
          <span className="text-sm text-slate-400">/day</span>
        </div>
        <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
          {job.workDate && <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2">📅 {job.workDate}</div>}
          {job.village && <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2">📍 {job.village}</div>}
          {job.distanceKm != null && <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2">{job.distanceKm.toFixed(1)} {t('km')}</div>}
        </div>
        {job.farmerName && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[28px] border border-cyan-400/10 bg-slate-950/85 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="h-10 w-10 rounded-full bg-cyan-500/10 text-center leading-10 text-cyan-300">👨‍🌾</span>
              <span>{job.farmerName}</span>
            </div>
            {job.farmerRating > 0 && <StarRating value={Number(job.farmerRating)} size="sm" />}
          </div>
        )}
        {job.pendingCount != null && job.pendingCount > 0 ? (
          <p className="mt-4 text-xs text-slate-500">
            {job.pendingCount} {t('pending')} · {job.acceptedCount} {t('acceptedCount')}
          </p>
        ) : job.acceptedCount != null ? (
          <p className="mt-4 text-xs text-slate-500">
            {job.acceptedCount} {t('acceptedCount')}
          </p>
        ) : null}
      </button>

      {user?.role === 'LABOURER' && (
        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('oneTapApply')}</div>
          <button
            type="button"
            onClick={handleQuickApply}
            disabled={applied || applying}
            className="rounded-[28px] bg-gradient-to-r from-cyan-500 via-blue-500 to-sky-400 px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_50px_-30px_rgba(56,189,248,0.7)] transition duration-200 enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {applying ? t('loading') : applied ? t('applied') : t('quickApply')}
          </button>
        </div>
      )}
    </div>
  )
}
