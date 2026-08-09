import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import api, { getApiErrorMessage, unwrap } from '../services/api'
import useAuthStore from '../store/authStore'
import Navbar from '../components/Navbar'
import BottomNavBar from '../components/BottomNavBar'
import StarRating from '../components/StarRating'
import Layout, { Button, InputField, PrimaryButton } from '../components/Layout'

const SKILLS = ['HARVESTING', 'PLANTING', 'IRRIGATION', 'SPRAYING', 'OTHER']

export default function Profile() {
  const { t, i18n } = useTranslation()
  const { user, logout, updateUser } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [ratings, setRatings] = useState([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      return undefined
    }

    let active = true

    const fetchProfile = async () => {
      setLoading(true)
      try {
        const [meRes, ratingsRes] = await Promise.all([
          api.get('/auth/me'),
          api.get(`/users/${user.id}/ratings`),
        ])
        if (!active) return
        const data = unwrap(meRes)
        setProfile(data)
        setRatings(unwrap(ratingsRes) || [])
        setForm({
          name: data.name,
          village: data.village || '',
          languagePref: data.languagePref || 'te',
          skills: data.skills || [],
          dailyWageExpected: data.dailyWageExpected || '',
        })
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchProfile()
    return () => {
      active = false
    }
  }, [user?.id])

  const save = async () => {
    setErrors({})
    const fieldErrors = {}
    if (form.name && form.name.trim().length < 2) fieldErrors.name = t('nameRequired')

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setSaving(true)
    try {
      const res = await api.put('/auth/profile', form)
      const data = unwrap(res)
      setProfile(data)
      updateUser({ ...user, name: data.name })
      if (form.languagePref) {
        i18n.changeLanguage(form.languagePref)
        localStorage.setItem('language', form.languagePref)
      }
      setEditing(false)
      toast.success(t('success'))
    } catch (err) {
      setErrors(err?.response?.data?.details || {})
      toast.error(getApiErrorMessage(err, t('error')))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <Navbar showNotifications={false} />
        <div className="p-8 text-center">{t('loading')}</div>
      </Layout>
    )
  }

  const initials = profile?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Layout>
      <Navbar />
      <div className="px-4 py-4">
        <div className="glass-card glass-panel rounded-[32px] border border-cyan-400/10 bg-slate-950/95 p-6 shadow-[0_28px_100px_-50px_rgba(56,189,248,0.55)]">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-3xl font-bold text-white shadow-[0_18px_50px_-20px_rgba(56,189,248,0.55)]">
            {initials}
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">{profile.name}</h1>
          <p className="mt-2 text-sm text-slate-400">{profile.phone}</p>
          <span className="mt-3 inline-flex items-center rounded-full border border-cyan-400/15 bg-slate-900/80 px-4 py-2 text-sm text-cyan-200">
            {t(profile.role.toLowerCase())}
          </span>
          {profile.village && <p className="mt-3 text-sm text-slate-400">📍 {profile.village}</p>}
          {profile.createdAt && (
            <p className="mt-2 text-sm text-slate-500">
              {t('memberSince')} {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="glass-card rounded-[28px] border border-white/10 bg-slate-950/90 p-5 shadow-[0_25px_80px_-35px_rgba(0,0,0,0.75)]">
            <p className="text-xl font-semibold text-white">{Number(profile.ratingAvg).toFixed(1)}</p>
            <StarRating value={Number(profile.ratingAvg)} />
            <p className="mt-2 text-sm text-slate-400">{profile.ratingCount} {t('recentRatings')}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass-card rounded-[28px] border border-white/10 bg-slate-950/90 p-5 text-center shadow-[0_25px_80px_-35px_rgba(0,0,0,0.75)]">
              <p className="text-lg font-bold text-white">{profile.totalJobs}</p>
              <p className="mt-1 text-xs text-slate-400">{t('totalJobs')}</p>
            </div>
            <div className="glass-card rounded-[28px] border border-white/10 bg-slate-950/90 p-5 text-center shadow-[0_25px_80px_-35px_rgba(0,0,0,0.75)]">
              <p className="text-lg font-bold text-white">{profile.ratingCount}</p>
              <p className="mt-1 text-xs text-slate-400">{t('avgRating')}</p>
            </div>
          </div>
        </div>

        {editing ? (
          <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
            <InputField label={t('name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
            <InputField label={t('village')} value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} error={errors.village} />
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">{t('language')}</label>
              <select
                value={form.languagePref}
                onChange={(e) => setForm({ ...form, languagePref: e.target.value })}
                className="w-full rounded-lg border px-4 py-3"
              >
                <option value="te">{t('telugu')}</option>
                <option value="en">{t('english')}</option>
              </select>
            </div>
            {profile.role === 'LABOURER' && (
              <>
                <p className="mb-2 text-sm font-medium">{t('skills')}</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {SKILLS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        const skills = form.skills.includes(skill)
                          ? form.skills.filter((s) => s !== skill)
                          : [...form.skills, skill]
                        setForm({ ...form, skills })
                      }}
                      className={`rounded-full px-3 py-1 text-sm ${
                        form.skills.includes(skill) ? 'bg-primary text-white' : 'border'
                      }`}
                    >
                      {t(skill.toLowerCase())}
                    </button>
                  ))}
                </div>
                <InputField
                  label={t('dailyWage')}
                  type="number"
                  value={form.dailyWageExpected}
                  onChange={(e) => setForm({ ...form, dailyWageExpected: e.target.value })}
                />
              </>
            )}
            <div className="flex gap-2">
              <PrimaryButton onClick={() => setEditing(false)} className="!bg-gray-500">{t('cancel')}</PrimaryButton>
              <PrimaryButton onClick={save} loading={saving}>{t('save')}</PrimaryButton>
            </div>
          </div>
        ) : (
          <PrimaryButton onClick={() => setEditing(true)} className="mt-4">{t('editProfile')}</PrimaryButton>
        )}

        <h2 className="mb-3 mt-6 font-semibold">{t('recentRatings')}</h2>
        {ratings.length === 0 ? (
          <p className="text-gray-500">{t('noRatings')}</p>
        ) : (
          <div className="space-y-3">
            {ratings.slice(0, 5).map((r) => (
              <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <StarRating value={r.stars} size="sm" />
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium">{r.raterName}</p>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        <Button onClick={logout} variant="danger" className="mt-6">{t('logout')}</Button>
      </div>
      <BottomNavBar />
    </Layout>
  )
}
