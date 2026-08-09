import { useState } from 'react'
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

  const submit = async () => {
    if (stars < 1) {
      toast.error('Please select a rating')
      return
    }
    if (!job?.id && !onSubmit) {
      toast.error('Job information is missing')
      return
    }
    setLoading(true)
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
      showAppToast(getApiErrorMessage(err, t('error')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        {done ? (
          <div className="py-8 text-center">
            <span className="text-5xl">🙏</span>
            <p className="mt-4 text-lg font-medium">{t('thankYou')}</p>
          </div>
        ) : (
          <>
            <h2 className="mb-1 text-xl font-bold">{t('rateJob')}</h2>
            <p className="mb-4 text-gray-600">{job.title}</p>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                {rateeName?.charAt(0)?.toUpperCase()}
              </div>
              <span className="font-medium">{rateeName}</span>
            </div>
            <StarRating value={stars} interactive onChange={setStars} size="lg" />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('comment')}
              className="mt-4 w-full rounded-lg border border-gray-300 p-3"
              rows={3}
            />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                {t('cancel')}
              </Button>
              <Button variant="primary" onClick={submit} loading={loading} className="flex-1">
                {t('submitRating')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
