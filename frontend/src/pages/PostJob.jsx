import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { getApiErrorMessage, showAppToast } from '../services/api'
import Navbar from '../components/Navbar'
import BottomNavBar from '../components/BottomNavBar'
import Layout, {
  Button,
  InputField,
  SelectField,
  TextAreaField,
  PrimaryButton,
} from '../components/Layout'
import { useGeolocation } from '../utils/geolocation'
import { mapBackendDetailsToMessages, validateJobForm } from '../utils/validation'

const CROPS = ['Rice', 'Cotton', 'Groundnut', 'Sugarcane', 'Other']
const WORK_TYPES = ['HARVESTING', 'PLANTING', 'IRRIGATION', 'SPRAYING', 'WEEDING', 'OTHER']

export default function PostJob() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { location, error: locationError, status: locationStatus, isLoading: locLoading, retryCapture } = useGeolocation()

  const [form, setForm] = useState({
    title: '',
    cropType: 'Rice',
    workType: 'HARVESTING',
    description: '',
    wagePerDay: 500,
    workersNeeded: 1,
    workDate: new Date().toISOString().split('T')[0],
    village: '',
  })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((prev) => {
      const nextErrors = validateJobForm({ ...form, [field]: value }, locationStatus)
      if (nextErrors[field]) {
        return { ...prev, [field]: nextErrors[field] }
      }
      const { [field]: _, ...others } = prev
      return others
    })
  }

  // Form is ready when all fields valid AND location is captured
  const isFormReady = Object.keys(validateJobForm(form, locationStatus)).length === 0 && locationStatus === 'ready' && location

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fieldErrors = validateJobForm(form, locationStatus)

    if (locationStatus !== 'ready' || !location) {
      fieldErrors.location = t('locationRequired')
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      setSubmitError(t('pleaseCompleteRequired'))
      return
    }

    setErrors({})
    setSubmitError('')
    setLoading(true)
    try {
      await api.post('/jobs', {
        ...form,
        latitude: location.lat,
        longitude: location.lng,
        wagePerDay: Number(form.wagePerDay),
        workersNeeded: Number(form.workersNeeded),
      })
      showAppToast(t('success'), 'success')
      navigate('/farmer')
    } catch (err) {
      setErrors(mapBackendDetailsToMessages(err?.response?.data?.details || {}))
      const message = getApiErrorMessage(err, t('error'))
      setSubmitError(message)
      showAppToast(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Navbar />
      <div className="px-3 py-6 sm:px-4">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-amber-500/8 via-slate-950 to-slate-950 p-6 sm:p-8 shadow-[0_20px_60px_-35px_rgba(255,122,89,0.3)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,122,89,0.16),transparent_35%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
              {t('postNewJob')}
            </div>
            <h1 className="mt-2 text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl">{t('postNewJob')}</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-300">Reach nearby verified labourers, set your requirements, and find the right workers for your farm.</p>
          </div>
        </div>

        <div className="mt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {Object.keys(errors).length > 0 && (
              <div className="rounded-2xl border border-rose-400/25 bg-rose-500/12 p-4 sm:p-5">
                <p className="text-sm font-semibold text-rose-200">Please complete all required fields</p>
                <ul className="mt-2 space-y-1 text-xs text-rose-200/80">
                  {Object.entries(errors).map(([key, err]) => err && <li key={key}>• {err}</li>)}
                </ul>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-lg">📋</div>
                <div>
                  <h3 className="text-lg font-bold text-white">Job Details</h3>
                  <p className="text-xs text-slate-400">Title, crop, and work type</p>
                </div>
              </div>
              <div className="space-y-4">
                <InputField
                  label={t('title')}
                  placeholder="e.g., Urgent Rice Harvesting"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  error={errors.title}
                  required
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField label={t('cropType')} value={form.cropType} onChange={(e) => update('cropType', e.target.value)}>
                    {CROPS.map((c) => (
                      <option key={c} value={c}>{t(c.toLowerCase())}</option>
                    ))}
                  </SelectField>
                  <SelectField label={t('workType')} value={form.workType} onChange={(e) => update('workType', e.target.value)}>
                    {WORK_TYPES.map((w) => (
                      <option key={w} value={w}>{t(w.toLowerCase())}</option>
                    ))}
                  </SelectField>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-lg">⏰</div>
                <div>
                  <h3 className="text-lg font-bold text-white">Schedule & Compensation</h3>
                  <p className="text-xs text-slate-400">When and how much you'll pay</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label={t('workDate')}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={form.workDate}
                    onChange={(e) => update('workDate', e.target.value)}
                    error={errors.workDate}
                    required
                  />
                  <InputField
                    label={t('wagePerDay')}
                    type="number"
                    min={200}
                    step={50}
                    placeholder="₹500"
                    value={form.wagePerDay}
                    onChange={(e) => update('wagePerDay', e.target.value)}
                    error={errors.wagePerDay}
                    helpText="Minimum ₹200 per day"
                    required
                  />
                </div>
                <InputField
                  label={t('workersNeeded')}
                  type="number"
                  min={1}
                  max={20}
                  placeholder="2"
                  value={form.workersNeeded}
                  onChange={(e) => update('workersNeeded', e.target.value)}
                  error={errors.workersNeeded}
                  required
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-lg">📝</div>
                <div>
                  <h3 className="text-lg font-bold text-white">About This Job</h3>
                  <p className="text-xs text-slate-400">Optional details for labourers</p>
                </div>
              </div>
              <TextAreaField
                label={t('description')}
                placeholder="Describe the job, required experience, tools needed, etc."
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                error={errors.description}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-lg">📍</div>
                <div>
                  <h3 className="text-lg font-bold text-white">Location</h3>
                  <p className="text-xs text-slate-400">Your farm location for nearby notifications</p>
                </div>
              </div>
              <div className="space-y-4">
                <InputField
                  label={t('village')}
                  placeholder="Village name"
                  value={form.village}
                  onChange={(e) => update('village', e.target.value)}
                  error={errors.village}
                  required
                />
                <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">GPS Location</p>
                      <p className="mt-1 text-xs text-slate-400">We need your precise location to notify nearby labourers accurately.</p>
                      
                      {/* Status: Ready ✅ */}
                      {locationStatus === 'ready' && !locationError && (
                        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/12 border border-emerald-400/30 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          📍 Location added
                        </p>
                      )}
                      
                      {/* Status: Error with message */}
                      {locationStatus === 'error' && locationError && (
                        <p className="mt-2 text-xs text-amber-200">{locationError}</p>
                      )}
                      
                      {/* Status: Capturing */}
                      {locationStatus === 'capturing' && (
                        <p className="mt-2 text-xs text-cyan-200">📡 Capturing your GPS location...</p>
                      )}
                    </div>
                    
                    {/* Button: Show "Enable Location" when permission denied, "Retry" when error, "Got Location" when ready */}
                    {locationStatus === 'error' && (
                      <Button
                        type="button"
                        onClick={() => retryCapture()}
                        loading={locLoading}
                        className="px-4 py-2.5 sm:px-5 sm:py-3 flex-shrink-0"
                      >
                        {locLoading ? '🔄 Retrying...' : '🔄 Enable Location'}
                      </Button>
                    )}
                    
                    {locationStatus === 'ready' && !locationError && (
                      <div className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-emerald-500/12 border border-emerald-400/30 px-4 py-2.5 sm:px-5 sm:py-3">
                        <span className="text-lg">✓</span>
                        <span className="text-sm font-semibold text-emerald-200">Ready</span>
                      </div>
                    )}
                    
                    {(locationStatus === 'idle' || locationStatus === 'capturing') && (
                      <Button
                        type="button"
                        onClick={() => retryCapture()}
                        loading={locLoading}
                        disabled={locLoading}
                        className="px-4 py-2.5 sm:px-5 sm:py-3 flex-shrink-0"
                      >
                        {locLoading ? '📡 Capturing...' : '📍 Get Location'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {submitError && <p className="rounded-lg border border-rose-400/30 bg-rose-500/12 p-3 text-sm text-rose-200">{submitError}</p>}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate('/farmer')}
                className="flex-1 rounded-xl border border-white/10 bg-slate-900/40 px-5 py-3 font-semibold text-white hover:bg-slate-900/60"
              >
                Cancel
              </button>
              <PrimaryButton
                type="submit"
                loading={loading}
                disabled={!isFormReady || loading}
                className="flex-1"
              >
                {t('postJob')}
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
      <BottomNavBar />
    </Layout>
  )
}
