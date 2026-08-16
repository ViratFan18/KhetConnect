import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import api, { getApiErrorMessage, showAppToast } from '../services/api'
import { Button } from './Layout'
import StarRating from './StarRating'

export default function RateJobModal({ job, rateeId, rateeName, onClose, onSuccess, onSubmit }) {
  const { t } = useTranslation()
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (stars < 1) {
      const message = '⭐ Pick at least one star'
      setError(message)
      toast.error(message)
      return
    }
    if (!job?.id && !onSubmit) {
      const message = '📄 Job details are missing'
      setError(message)
      toast.error(message)
      return
    }
    setLoading(true)
    setError('')
    try {
      if (onSubmit) {
        await onSubmit({ rating: stars, comment })
      } else {
        const payload = {
          jobId: job.id,
          rateeId,
          stars,
          comment,
        }
        await api.post('/ratings', payload, { suppressErrorToast: true })
      }
      setDone(true)
      showAppToast(t('thankYou'), 'success')
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (err) {
      const message = getApiErrorMessage(err, t('error'))
      setError(message)
      showAppToast(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {/* Header gradient */}
        <div className="absolute inset-0 h-32 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative p-6 sm:p-8">
          {done ? (
            <div className="py-12 text-center">
              {/* Success animation */}
              <div className="relative mb-6">
                <div className="mx-auto h-24 w-24 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                  <span className="text-5xl animate-bounce">✓</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{t('thankYou')}</p>
              <p className="mt-2 text-sm text-slate-400">Your rating has been submitted</p>
            </div>
          ) : (
            <>
              {/* Title */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">{t('rateJob')}</h2>
                <p className="mt-1 text-sm text-slate-400">{job.title}</p>
              </div>

              {/* Ratee info */}
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-500/10 text-lg font-bold text-emerald-300">
                  {rateeName?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{rateeName}</p>
                  <p className="text-xs text-slate-400">Provide honest feedback</p>
                </div>
              </div>

              {/* Rating section */}
              <div className="mb-6 rounded-xl border border-white/10 bg-slate-900/30 p-4">
                <p className="mb-4 text-sm font-semibold text-slate-200">How would you rate this work?</p>
                <div className="flex justify-center gap-2">
                  <StarRating value={stars} interactive onChange={(nextValue) => {
                    setStars(nextValue)
                    setError('')
                  }} size="lg" />
                </div>
                {stars > 0 && (
                  <p className="mt-3 text-center text-xs text-slate-400">
                    {stars === 1 && 'Poor - Needs improvement'}
                    {stars === 2 && 'Fair - Could be better'}
                    {stars === 3 && 'Good - Satisfied'}
                    {stars === 4 && 'Very Good - Impressed'}
                    {stars === 5 && 'Excellent - Highly recommended'}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Comments <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="oracle-input w-full p-3 text-sm bg-slate-900/40 border border-white/10 rounded-lg focus:border-emerald-400/50 focus:bg-slate-900/60 focus:outline-none transition"
                  rows={3}
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-slate-500">{comment.length}/200</p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3" role="alert">
                  <p className="text-sm text-rose-200">⚠️ {error}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button 
                  variant="secondary" 
                  onClick={onClose} 
                  className="flex-1" 
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="success" 
                  onClick={submit} 
                  loading={loading} 
                  disabled={loading || stars < 1} 
                  className="flex-1"
                  icon="✓"
                >
                  Submit Rating
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
