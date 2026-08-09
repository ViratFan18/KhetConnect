import { useState } from 'react'
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
import { getCurrentLocation, updateUserLocation } from '../utils/location'

const CROPS = ['Rice', 'Cotton', 'Groundnut', 'Sugarcane', 'Other']
const WORK_TYPES = ['HARVESTING', 'PLANTING', 'IRRIGATION', 'SPRAYING', 'WEEDING', 'OTHER']

export default function PostJob() {
  const { t } = useTranslation()
  const navigate = useNavigate()
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
  const [location, setLocation] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [locLoading, setLocLoading] = useState(false)
  const [locationStatus, setLocationStatus] = useState('idle')

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const captureLocation = async (showSuccess = true) => {
    setLocLoading(true)
    setLocationStatus('capturing')
    setErrors((prev) => ({ ...prev, location: undefined }))

    try {
      const { lat, lng } = await getCurrentLocation()
      const coords = { lat, lng }
      setLocation(coords)
      setLocationStatus('ready')

      try {
        await updateUserLocation(lat, lng)
      } catch {
        // keep the local location for this post even if backend sync is temporarily unavailable
      }

      return coords
    } catch (err) {
      const message = err?.message || t('locationDenied')
      setLocationStatus('error')
      setErrors((prev) => ({ ...prev, location: message }))
      showAppToast(message)
      return null
    } finally {
      setLocLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    if (locationStatus !== 'ready' || !location) {
      showAppToast(t('locationRequired'))
      setErrors({ location: t('locationRequired') })
      return
    }

    const fieldErrors = {}
    if (!form.title.trim()) fieldErrors.title = t('titleRequired')
    if (!form.workDate) fieldErrors.workDate = t('workDateRequired')
    if (!form.wagePerDay || Number(form.wagePerDay) < 100) fieldErrors.wagePerDay = t('wagePerDayInvalid')
    if (!form.workersNeeded || Number(form.workersNeeded) < 1) fieldErrors.workersNeeded = t('workersNeededInvalid')

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

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
      setErrors(err?.response?.data?.details || {})
      const message = getApiErrorMessage(err, t('error'))
      showAppToast(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Navbar />
      <div className="px-4 py-4">
        <div className="glass-card glass-panel rounded-[32px] border border-cyan-400/10 bg-slate-950/95 p-6 shadow-[0_28px_100px_-50px_rgba(56,189,248,0.55)]">
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/15 bg-slate-900/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-cyan-300 shadow-[0_18px_50px_-30px_rgba(56,189,248,0.45)]">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_0_4px_rgba(56,189,248,0.14)]"></span>
              {t('postNewJob')}
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white">{t('postNewJob')}</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-400">Reach nearby workers in one step with premium job cards and bold field guidance.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 rounded-[32px] border border-white/10 bg-slate-950/90 p-6 shadow-[0_30px_90px_-50px_rgba(0,0,0,0.9)]">
          {Object.keys(errors).length > 0 && (
            <div className="mb-5 rounded-[28px] border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              Please complete all required fields before posting.
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <InputField
              label={t('title')}
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              error={errors.title}
              required
            />
            <SelectField label={t('cropType')} value={form.cropType} onChange={(e) => update('cropType', e.target.value)}>
              {CROPS.map((c) => (
                <option key={c} value={c}>{t(c.toLowerCase())}</option>
              ))}
            </SelectField>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SelectField label={t('workType')} value={form.workType} onChange={(e) => update('workType', e.target.value)}>
              {WORK_TYPES.map((w) => (
                <option key={w} value={w}>{t(w.toLowerCase())}</option>
              ))}
            </SelectField>
            <InputField
              label={t('workDate')}
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={form.workDate}
              onChange={(e) => update('workDate', e.target.value)}
              error={errors.workDate}
              required
            />
          </div>

          <TextAreaField
            label={t('description')}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            error={errors.description}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <InputField
              label={t('wagePerDay')}
              type="number"
              min={200}
              value={form.wagePerDay}
              onChange={(e) => update('wagePerDay', e.target.value)}
              error={errors.wagePerDay}
              required
            />
            <InputField
              label={t('workersNeeded')}
              type="number"
              min={1}
              max={20}
              value={form.workersNeeded}
              onChange={(e) => update('workersNeeded', e.target.value)}
              error={errors.workersNeeded}
              required
            />
          </div>

          <InputField
            label={t('village')}
            value={form.village}
            onChange={(e) => update('village', e.target.value)}
            error={errors.village}
            required
          />

          <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{t('location')}</p>
                <p className="mt-1 text-sm text-slate-400">We use your current location to notify nearby workers and improve matching.</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => captureLocation(true)}
                loading={locLoading}
                className="rounded-[28px] px-6 py-3"
              >
                {locationStatus === 'ready' ? '✅' : '📍'} {locLoading ? t('loading') : t('getLocation')}
              </Button>
            </div>
            {locationStatus === 'capturing' && (
              <p className="mt-4 text-sm text-slate-300">{t('capturingLocation')}</p>
            )}
            {errors.location && (
              <p className="mt-4 text-sm text-rose-300">{errors.location}</p>
            )}
            {locationStatus === 'ready' && !errors.location && (
              <p className="mt-4 text-sm text-slate-400">{t('locationReadyMessage')}</p>
            )}
          </div>

          <div className="mt-6">
            <PrimaryButton type="submit" loading={loading} disabled={locationStatus !== 'ready'} className="w-full btn-gradient">
              {t('postJob')}
            </PrimaryButton>
          </div>
        </form>
      </div>
      <BottomNavBar />
    </Layout>
  )
}
