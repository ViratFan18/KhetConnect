import { useEffect, useState } from 'react'
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
  const [rateModal, setRateModal] = useState(null)

  const isFarmer = user?.role === 'FARMER'
  const isOwner = job?.farmerId === user?.id

  async function loadJob() {
    setLoading(true)
    try {
      const res = await api.get(`/jobs/${id}`)
      setJob(unwrap(res))
    } catch {
      toast.error(t('error'))
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    const fetchJob = async () => {
      if (!id) return
      try {
        const res = await api.get(`/jobs/${id}`)
        if (active) setJob(unwrap(res))
      } catch {
        if (active) {
          toast.error(t('error'))
          navigate(-1)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchJob()
    return () => {
      active = false
    }
  }, [id, navigate, t])

  const apply = async () => {
    setApplying(true)
    try {
      const res = await api.post(`/jobs/${id}/apply`)
      setJob(unwrap(res))
      toast.success(t('applied'))
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('error')))
    } finally {
      setApplying(false)
    }
  }

  const acceptLabourer = async (labourerId) => {
    try {
      await api.put(`/jobs/${id}/accept/${labourerId}`)
      toast.success(t('accepted'))
      await loadJob()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('error')))
    }
  }

  const rejectLabourer = async (labourerId) => {
    try {
      await api.put(`/jobs/${id}/reject/${labourerId}`)
      toast.success(t('rejected'))
      await loadJob()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('error')))
    }
  }

  const completeJob = async () => {
    if (!window.confirm(t('confirmComplete'))) return
    try {
      const res = await api.put(`/jobs/${id}/complete`)
      const updatedJob = unwrap(res)
      setJob(updatedJob)
      toast.success(t('completed'))
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
      toast.error(getApiErrorMessage(err, t('error')))
    }
  }

  const cancelJob = async () => {
    try {
      const res = await api.put(`/jobs/${id}/cancel`)
      setJob(unwrap(res))
      toast.success(t('cancelled'))
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('error')))
    }
  }

  if (loading) {
    return (
      <Layout>
        <Navbar />
        <div className="p-8 text-center">{t('loading')}</div>
      </Layout>
    )
  }

  if (!job) return null

  const isFull = job.acceptedCount >= job.workersNeeded
  const backPath = isFarmer ? '/my-jobs' : '/nearby-jobs'

  return (
    <Layout>
      <Navbar />
      <div className="px-4 py-4">
        <button type="button" onClick={() => navigate(backPath)} className="mb-4 text-cyan-300">
          ← {t('back')}
        </button>

        <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-4 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.95)]">
          <h1 className="text-2xl font-semibold text-white">{job.title}</h1>
          <p className="mt-1 text-slate-400">{t(job.workType?.toLowerCase())} · {job.cropType}</p>

          <div className="mt-4 rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-4">
            <p className="text-3xl font-bold text-cyan-300">₹{job.wagePerDay}<span className="text-base font-normal text-slate-400">/day</span></p>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>📅 {job.workDate}</p>
              <p>📍 {job.village}</p>
              <p>👷 {job.workersNeeded} {t('workersNeeded')}</p>
              {job.distanceKm != null && <p>{job.distanceKm.toFixed(1)} {t('km')} away</p>}
            </div>
            {job.description && (
              <p className="mt-3 text-slate-300">{job.description}</p>
            )}
          </div>

          <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/40 p-4">
            <h2 className="font-semibold text-white">{t('farmerSection')}</h2>
            <div className="mt-2 flex items-center gap-2 text-slate-300">
              <span>{job.farmerName}</span>
              <StarRating value={Number(job.farmerRating)} size="sm" />
              <span className="text-sm text-slate-500">({job.farmerRatingCount})</span>
            </div>
          </div>

          {!isFarmer && (
            <div className="mt-6 space-y-3">
              {job.myApplicationStatus ? (
                <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${
                  job.myApplicationStatus === 'ACCEPTED' ? 'bg-emerald-400/15 text-emerald-300' :
                  job.myApplicationStatus === 'REJECTED' ? 'bg-rose-400/15 text-rose-300' :
                  'bg-amber-400/15 text-amber-300'
                }`}>
                  {t(job.myApplicationStatus.toLowerCase())}
                </span>
              ) : isFull ? (
                <span className="inline-block rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">{t('full')}</span>
              ) : (
                <PrimaryButton onClick={apply} loading={applying}>{t('apply')}</PrimaryButton>
              )}
              {job.farmerPhone && (
                <a href={`tel:${job.farmerPhone}`} className="block">
                  <PrimaryButton className="from-cyan-500/70 to-blue-700">{t('callFarmer')}</PrimaryButton>
                </a>
              )}
            </div>
          )}

        {isOwner && job.applicants?.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 font-semibold">{t('applicants')}</h2>
            <div className="space-y-3">
              {job.applicants.map((a) => (
                <div key={a.applicationId} className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <StarRating value={Number(a.ratingAvg)} size="sm" />
                      {a.skills && <p className="text-sm text-gray-500">{a.skills}</p>}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      a.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                      a.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {t(a.status.toLowerCase())}
                    </span>
                  </div>
                  {a.status === 'PENDING' && !isFull && (
                    <div className="mt-3 flex gap-2">
                      <Button onClick={() => acceptLabourer(a.labourerId)} className="flex-1">
                        {t('accept')}
                      </Button>
                      <Button onClick={() => rejectLabourer(a.labourerId)} variant="danger" className="flex-1">
                        {t('reject')}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isOwner && (job.status === 'OPEN' || job.status === 'IN_PROGRESS') && (
          <div className="mt-6 space-y-3">
            {job.status === 'IN_PROGRESS' && (
              <PrimaryButton onClick={completeJob}>{t('markComplete')}</PrimaryButton>
            )}
            <Button onClick={cancelJob} variant="danger" className="w-full">{t('cancelJob')}</Button>
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
