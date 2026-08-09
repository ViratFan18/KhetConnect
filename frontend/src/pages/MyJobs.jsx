import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { unwrap } from '../services/api'
import Navbar from '../components/Navbar'
import BottomNavBar from '../components/BottomNavBar'
import JobCard from '../components/JobCard'
import RateJobModal from '../components/RateJobModal'
import Layout, { Button, PrimaryButton } from '../components/Layout'
import { JobCardSkeleton } from '../components/Skeleton'

export default function MyJobs() {
  const { t } = useTranslation()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [applicants, setApplicants] = useState({})
  const [rateModal, setRateModal] = useState(null)

  useEffect(() => {
    loadJobs()
  }, [])

  async function loadJobs() {
    setLoading(true)
    try {
      const res = await api.get('/jobs/my-posts')
      setJobs(unwrap(res) || [])
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = async (jobId) => {
    if (expanded === jobId) {
      setExpanded(null)
      return
    }
    setExpanded(jobId)
    if (!applicants[jobId]) {
      const res = await api.get(`/jobs/${jobId}/applicants`)
      setApplicants((prev) => ({ ...prev, [jobId]: unwrap(res) || [] }))
    }
  }

  const acceptLabourer = async (jobId, labourerId) => {
    await api.put(`/jobs/${jobId}/accept/${labourerId}`)
    loadJobs()
    const res = await api.get(`/jobs/${jobId}/applicants`)
    setApplicants((prev) => ({ ...prev, [jobId]: unwrap(res) || [] }))
  }

  const rejectLabourer = async (jobId, labourerId) => {
    await api.put(`/jobs/${jobId}/reject/${labourerId}`)
    const res = await api.get(`/jobs/${jobId}/applicants`)
    setApplicants((prev) => ({ ...prev, [jobId]: unwrap(res) || [] }))
  }

  const completeJob = async (jobId) => {
    if (!window.confirm(t('confirmComplete'))) return
    await api.put(`/jobs/${jobId}/complete`)
    loadJobs()
    const job = jobs.find((j) => j.id === jobId)
    const apps = applicants[jobId] || []
    const accepted = apps.find((a) => a.status === 'ACCEPTED')
    if (accepted) {
      setRateModal({
        job,
        rateeId: accepted.labourerId,
        rateeName: accepted.name,
        onSubmit: async ({ rating, comment }) => {
          await api.post('/ratings', { jobId: jobId, rateeId: accepted.labourerId, stars: rating, comment }, { suppressErrorToast: true })
        },
      })
    }
  }

  return (
    <Layout>
      <Navbar />
      <div className="px-4 py-4">
        <h1 className="mb-4 text-xl font-bold">{t('myJobs')}</h1>

        {loading ? (
          <div className="space-y-3">
            <JobCardSkeleton />
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center">
            <span className="text-4xl">📋</span>
            <p className="mt-2 font-medium">{t('noJobsPosted')}</p>
            <p className="text-sm text-gray-500">{t('postFirstJob')}</p>
            <Link to="/post-job" className="mt-4 block">
              <PrimaryButton>{t('postNewJob')}</PrimaryButton>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id}>
                <div onClick={() => toggleExpand(job.id)} className="cursor-pointer">
                  <JobCard job={job} onClick={() => toggleExpand(job.id)} />
                </div>
                {expanded === job.id && (
                  <div className="mt-2 rounded-xl bg-white p-4 shadow-sm">
                    {(applicants[job.id] || []).length === 0 ? (
                      <p className="text-sm text-gray-500">{t('noApplicants')}</p>
                    ) : (
                      (applicants[job.id] || []).map((a) => (
                        <div key={a.applicationId} className="mb-3 flex items-center justify-between border-b pb-3 last:border-0">
                          <div>
                            <p className="font-medium">{a.name}</p>
                            <p className="text-sm text-gray-500">★ {Number(a.ratingAvg).toFixed(1)}</p>
                          </div>
                          {a.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <Button onClick={() => acceptLabourer(job.id, a.labourerId)} className="flex-1">
                                {t('accept')}
                              </Button>
                              <Button onClick={() => rejectLabourer(job.id, a.labourerId)} variant="danger" className="flex-1">
                                {t('reject')}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    {job.status === 'IN_PROGRESS' && (
                      <PrimaryButton onClick={() => completeJob(job.id)} className="mt-2">
                        {t('markComplete')}
                      </PrimaryButton>
                    )}
                  </div>
                )}
              </div>
            ))}
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
          onSuccess={loadJobs}
        />
      )}
    </Layout>
  )
}
