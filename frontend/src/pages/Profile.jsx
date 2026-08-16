import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import api, { getApiErrorMessage, unwrap } from '../services/api'
import useAuthStore from '../store/authStore'
import Navbar from '../components/Navbar'
import BottomNavBar from '../components/BottomNavBar'
import StarRating from '../components/StarRating'
import Layout, { InputField, PrimaryButton } from '../components/Layout'
import { mapBackendDetailsToMessages, validateProfileForm } from '../utils/validation'

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
    const fieldErrors = validateProfileForm(form, profile?.role)

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setSaving(true)
    try {
      const res = await api.put('/auth/profile', form, { suppressErrorToast: true })
      const data = unwrap(res)
      setProfile(data)
      updateUser({ ...user, name: data.name })
      if (form.languagePref) {
        i18n.changeLanguage(form.languagePref)
        localStorage.setItem('language', form.languagePref)
      }
      setEditing(false)
      toast.success('Saved')
    } catch (err) {
      setErrors(mapBackendDetailsToMessages(err?.response?.data?.details || {}))
      toast.error(getApiErrorMessage(err, 'Could not save'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <Navbar showNotifications={false} />
        <div className="px-3 py-8 sm:px-4 text-center text-slate-300">{t('loading')}</div>
      </Layout>
    )
  }

  const initials = profile?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Layout>
      <Navbar />
      <div className="px-3 py-6 sm:px-4">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-500/8 via-slate-950 to-slate-950 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.15),transparent_30%)]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-3xl font-bold text-white shadow-[0_18px_50px_-20px_rgba(139,92,246,0.6)]">
              {initials}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-[-0.06em] text-white">{profile?.name}</h1>
            <p className="mt-2 text-sm text-slate-400">{profile?.phone}</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400"></span>
              <span className="text-sm font-semibold text-violet-200">{t(profile?.role?.toLowerCase())}</span>
            </div>
            {profile?.village && <p className="mt-3 text-sm text-slate-300">📍 {profile.village}</p>}
            {profile?.createdAt && (
              <p className="mt-2 text-xs text-slate-500">
                {t('memberSince')} {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {profile && (
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Rating</p>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-3xl font-bold text-cyan-400">{Number(profile.ratingAvg).toFixed(1)}</p>
                <span className="text-xs text-slate-400">/ 5</span>
              </div>
              <div className="mt-2"><StarRating value={Number(profile.ratingAvg)} size="sm" /></div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Total Jobs</p>
              <p className="mt-3 text-3xl font-bold text-cyan-400">{profile.totalJobs || 0}</p>
              <p className="mt-2 text-xs text-slate-400">Completed or ongoing</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Reviews</p>
              <p className="mt-3 text-3xl font-bold text-cyan-400">{profile.ratingCount || 0}</p>
              <p className="mt-2 text-xs text-slate-400">From verified users</p>
            </div>
          </div>
        )}

        <div className="mt-8">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/40 px-6 py-3 font-semibold text-white hover:bg-slate-900/60 transition"
            >
              ✏️ Edit Profile
            </button>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6 space-y-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-300">
                <span>Editing your profile</span>
              </div>

              <InputField
                label={t('name')}
                value={form.name}
                onChange={(e) => {
                  const value = e.target.value
                  setForm({ ...form, name: value })
                  const nextErrors = validateProfileForm({ ...form, name: value }, profile?.role)
                  setErrors((prev) => ({ ...prev, ...nextErrors, name: nextErrors.name }))
                }}
                error={errors.name}
                required
              />
              <InputField
                label={t('village')}
                value={form.village}
                onChange={(e) => {
                  const value = e.target.value
                  setForm({ ...form, village: value })
                  const nextErrors = validateProfileForm({ ...form, village: value }, profile?.role)
                  setErrors((prev) => ({ ...prev, ...nextErrors, village: nextErrors.village }))
                }}
                error={errors.village}
              />

              <div className="mb-4">
                <label className="mb-2 block text-sm font-semibold text-slate-300">{t('language')}</label>
                <select
                  value={form.languagePref}
                  onChange={(e) => setForm({ ...form, languagePref: e.target.value })}
                  className="oracle-input w-full px-4 py-3.5"
                >
                  <option value="te">{t('telugu')}</option>
                  <option value="en">{t('english')}</option>
                </select>
              </div>

              {profile?.role === 'LABOURER' && (
                <>
                  <div className="mb-4">
                    <p className="mb-3 text-sm font-semibold text-slate-300">{t('skills')}</p>
                    <div className="flex flex-wrap gap-2">
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
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                            form.skills.includes(skill)
                              ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
                              : 'border-white/10 bg-slate-950/50 text-slate-300 hover:border-white/20'
                          }`}
                        >
                          {t(skill.toLowerCase())}
                        </button>
                      ))}
                    </div>
                  </div>
                  <InputField
                    label={t('dailyWage')}
                    type="number"
                    value={form.dailyWageExpected}
                    onChange={(e) => {
                      const value = e.target.value
                      setForm({ ...form, dailyWageExpected: value })
                      const nextErrors = validateProfileForm({ ...form, dailyWageExpected: value }, profile?.role)
                      setErrors((prev) => ({ ...prev, ...nextErrors, dailyWageExpected: nextErrors.dailyWageExpected }))
                    }}
                    error={errors.dailyWageExpected}
                  />
                </>
              )}

              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 rounded-lg border border-white/10 bg-slate-900/40 px-4 py-3 font-semibold text-white hover:bg-slate-900/60"
                >
                  Cancel
                </button>
                <PrimaryButton onClick={save} loading={saving} className="flex-1">
                  {t('save')}
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold tracking-[-0.05em] text-white">{t('recentRatings')}</h2>
          <p className="mt-1 text-sm text-slate-400">Feedback from users</p>

          {ratings.length === 0 ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/40 p-8 text-center">
              <span className="text-4xl">⭐</span>
              <p className="mt-3 text-slate-400">{t('noRatings')}</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {ratings.slice(0, 5).map((r) => (
                <div key={r.id} className="rounded-xl border border-white/10 bg-slate-900/40 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <StarRating value={r.stars} size="sm" />
                        <span className="text-sm font-semibold text-slate-200">{r.stars}/5 stars</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-100">{r.raterName}</p>
                      {r.comment && <p className="mt-1 text-sm text-slate-300">"{r.comment}"</p>}
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">
                      {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className="mt-10 w-full rounded-lg border border-rose-400/30 bg-rose-500/12 px-6 py-3 font-semibold text-rose-200 hover:bg-rose-500/20 transition"
        >
          🚪 {t('logout')}
        </button>
      </div>
      <BottomNavBar />
    </Layout>
  )
}
