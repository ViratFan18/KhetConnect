import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { getApiErrorMessage, showAppToast, unwrap } from '../services/api'
import useAuthStore from '../store/authStore'
import LanguageToggle from '../components/LanguageToggle'
import { Button, InputField } from '../components/Layout'
import { mapBackendDetailsToMessages, validateLoginForm } from '../utils/validation'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const normalizedPhone = phone.replace(/\D/g, '')
  const isFormValid = Object.keys(validateLoginForm({ phone: normalizedPhone, password })).length === 0

  const updateFieldError = (field, value) => {
    setErrors((prev) => {
      const next = { ...prev }
      const nextErrors = validateLoginForm({
        phone: field === 'phone' ? value.replace(/\D/g, '') : normalizedPhone,
        password: field === 'password' ? value : password,
      })

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
    const fieldErrors = validateLoginForm({ phone: normalizedPhone, password })

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setLoading(true)
    try {
      const res = await api.post('/api/v1/auth/login', { phone: normalizedPhone, password })
      const data = unwrap(res)
      login(data.token, { id: data.userId, role: data.role, name: data.name })
      showAppToast(t('loginSuccess'), 'success')
      navigate(data.role === 'FARMER' ? '/farmer' : '/labourer')
    } catch (err) {
      const responseErrors = mapBackendDetailsToMessages(err?.response?.data?.details || {})
      setErrors(responseErrors)
      const message = getApiErrorMessage(err, t('loginFailed'))
      showAppToast(message)
    } finally {
      setLoading(false)
    }
  }

  const promptMessage = location.state?.prompt === 'loginRequired'
    ? t('loginRequiredMessage')
    : location.state?.prompt === 'roleMismatch'
      ? t('roleMismatchMessage')
      : null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background gradient - warm farmer-friendly aesthetic */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(120,119,198,0.15),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(255,122,89,0.12),transparent_35%)]" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
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
          {promptMessage && (
            <div className="mb-5 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-sm text-amber-100">
              {promptMessage}
            </div>
          )}

          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/70">🚀 Welcome</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">Sign In</h1>
            <p className="mt-2 text-sm text-slate-300">Connect with farmers or find work near you</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label={t('phone')}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={phone}
              onChange={(e) => {
                const nextValue = e.target.value.replace(/\D/g, '').slice(0, 10)
                setPhone(nextValue)
                updateFieldError('phone', nextValue)
              }}
              onBlur={() => updateFieldError('phone', normalizedPhone)}
              placeholder="9876543210"
              error={errors.phone}
              required
            />

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
                  aria-label={showPassword ? 'Hide field value' : 'Show field value'}
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

            <div className="flex items-center justify-between gap-3 text-sm pt-2">
              <Link to="/register" className="font-medium text-amber-300 hover:text-amber-200 transition">Create account</Link>
              <Link to="/forgot-password" className="font-medium text-slate-300 hover:text-white transition">Forgot password?</Link>
            </div>

            <Button type="submit" loading={loading} disabled={!isFormValid || loading} className="mt-4 w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
              {t('login')}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-slate-400">
              Secure access for farmers and labourers.
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
