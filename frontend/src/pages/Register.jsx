import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { getApiErrorMessage, showAppToast, unwrap } from '../services/api'
import useAuthStore from '../store/authStore'
import LanguageToggle from '../components/LanguageToggle'
import { InputField, PrimaryButton } from '../components/Layout'
import { mapBackendDetailsToMessages, validateRegisterForm } from '../utils/validation'

const SKILLS = ['HARVESTING', 'PLANTING', 'IRRIGATION', 'SPRAYING', 'OTHER']

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [role, setRole] = useState('FARMER')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [village, setVillage] = useState('')
  const [skills, setSkills] = useState([])
  const [dailyWage, setDailyWage] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const normalizedPhone = phone.replace(/\D/g, '')
  const formData = {
    name,
    phone: normalizedPhone,
    password,
    confirmPassword,
    role,
    village,
    skills,
    dailyWageExpected: dailyWage,
  }
  const isFormValid = Object.keys(validateRegisterForm(formData)).length === 0

  const toggleSkill = (skill) => {
    setSkills((prev) => {
      const next = prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
      setErrors((current) => {
        const nextErrors = validateRegisterForm({ ...formData, skills: next })
        return Object.keys(nextErrors).length ? { ...current, ...nextErrors } : {}
      })
      return next
    })
  }

  const updateFieldError = (field, nextValue) => {
    setErrors((prev) => {
      const nextErrors = validateRegisterForm({
        ...formData,
        [field]: nextValue,
      })
      const next = { ...prev }

      if (nextErrors[field]) {
        next[field] = nextErrors[field]
      } else {
        delete next[field]
      }

      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const normalizedPhone = phone.replace(/\D/g, '')
    const fieldErrors = validateRegisterForm({
      name,
      phone: normalizedPhone,
      password,
      confirmPassword,
      role,
      village,
      skills,
      dailyWageExpected: dailyWage,
    })

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setLoading(true)
    try {
      const payload = {
        name,
        phone: normalizedPhone,
        password,
        role,
        village: role === 'FARMER' ? village : undefined,
        skills: role === 'LABOURER' ? skills : undefined,
        dailyWageExpected: role === 'LABOURER' ? Number(dailyWage) || 0 : undefined,
      }
      const res = await api.post('/auth/register', payload)
      const data = unwrap(res)
      login(data.token, { id: data.userId, role: data.role, name: data.name })
      showAppToast(t('registerSuccess'), 'success')
      navigate(data.role === 'FARMER' ? '/farmer' : '/labourer')
    } catch (err) {
      setErrors(mapBackendDetailsToMessages(err?.response?.data?.details || {}))
      const message = getApiErrorMessage(err, t('registerFailed'))
      showAppToast(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background gradient - warm farmer-friendly aesthetic */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(120,119,198,0.15),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(255,122,89,0.12),transparent_35%)]" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Header with Logo and Language */}
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-red-500 text-xl font-bold text-white shadow-lg shadow-orange-500/30">
              🌾
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-white">{t('appName')}</p>
              <p className="text-xs text-slate-400 font-medium">Farmer & Labourer</p>
            </div>
          </div>
          <LanguageToggle />
        </div>

        {/* Main Card */}
        <div className="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-amber-950/40 p-6 shadow-2xl shadow-black/50 sm:p-8 backdrop-blur-sm">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/70">✨ New Member</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">Create Account</h1>
            <p className="mt-2 text-sm text-slate-300">Join as a farmer or labourer and start connecting</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-300">{t('role')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {['FARMER', 'LABOURER'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`role-card ${role === r ? 'active' : ''} ${r === 'FARMER' ? 'farmer' : 'labourer'} flex min-h-[78px] flex-col items-start justify-between p-4 text-left`}
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{r === 'FARMER' ? 'Grow' : 'Work'}</span>
                  <span className="text-xl font-bold text-white">{t(r.toLowerCase())}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label={t('name')}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                updateFieldError('name', e.target.value)
              }}
              onBlur={() => updateFieldError('name', name)}
              error={errors.name}
              required
            />
            <InputField
              label={t('phone')}
              type="tel"
              value={phone}
              onChange={(e) => {
                const nextValue = e.target.value.replace(/\D/g, '').slice(0, 10)
                setPhone(nextValue)
                updateFieldError('phone', nextValue)
              }}
              onBlur={() => updateFieldError('phone', normalizedPhone)}
              error={errors.phone}
              required
            />
          </div>

          <InputField
            label={t('password')}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              updateFieldError('password', e.target.value)
            }}
            onBlur={() => updateFieldError('password', password)}
            error={errors.password}
            required
            rightSlot={
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-md p-1.5 text-slate-300 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/60"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M3 3l18 18" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            }
          />

          <InputField
            label={t('confirmPassword')}
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              updateFieldError('confirmPassword', e.target.value)
            }}
            onBlur={() => updateFieldError('confirmPassword', confirmPassword)}
            error={errors.confirmPassword}
            required
          />

          {role === 'FARMER' && (
            <InputField
              label={t('village')}
              value={village}
              onChange={(e) => {
                setVillage(e.target.value)
                updateFieldError('village', e.target.value)
              }}
              onBlur={() => updateFieldError('village', village)}
              error={errors.village}
            />
          )}

          {role === 'LABOURER' && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-300">{t('skills')}</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                      skills.includes(skill)
                        ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-200'
                        : 'border-white/10 bg-slate-950/50 text-slate-300'
                    }`}
                  >
                    {t(skill.toLowerCase())}
                  </button>
                ))}
              </div>
              {errors.skills && <p className="mb-4 text-sm text-rose-300">{errors.skills}</p>}
              <InputField
                label={t('dailyWage')}
                type="number"
                value={dailyWage}
                onChange={(e) => {
                  setDailyWage(e.target.value)
                  updateFieldError('dailyWageExpected', e.target.value)
                }}
                onBlur={() => updateFieldError('dailyWageExpected', dailyWage)}
                error={errors.dailyWageExpected}
                min={200}
              />
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-300">
              {t('hasAccount')}{' '}
              <Link to="/login" className="font-semibold text-amber-300 hover:text-amber-200 transition">{t('login')}</Link>
            </p>
            <PrimaryButton type="submit" loading={loading} disabled={!isFormValid || loading} className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
              {t('register')}
            </PrimaryButton>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-slate-400">
            By creating an account, you agree to our <Link to="#" className="text-amber-300 hover:text-amber-200">Terms</Link> and <Link to="#" className="text-amber-300 hover:text-amber-200">Privacy Policy</Link>
          </p>
        </div>
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <span>🔒</span>
            <span>Secure</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <span>✓</span>
            <span>Verified</span>
          </div>
        </div>
      </div>
    </div>
  )
}
