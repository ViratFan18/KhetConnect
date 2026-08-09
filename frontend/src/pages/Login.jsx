import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { getApiErrorMessage, showAppToast, unwrap } from '../services/api'
import useAuthStore from '../store/authStore'
import LanguageToggle from '../components/LanguageToggle'
import Layout, { Button, InputField } from '../components/Layout'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    const fieldErrors = {}
    const normalizedPhone = phone.replace(/\D/g, '')

    if (!normalizedPhone) {
      fieldErrors.phone = t('phoneRequired')
    } else if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      fieldErrors.phone = t('phoneInvalid')
    }
    if (!password.trim()) fieldErrors.password = t('passwordRequired')
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/login', { phone: normalizedPhone, password })
      const data = unwrap(res)
      login(data.token, { id: data.userId, role: data.role, name: data.name })
      showAppToast(t('loginSuccess'), 'success')
      navigate(data.role === 'FARMER' ? '/farmer' : '/labourer')
    } catch (err) {
      const responseErrors = err?.response?.data?.details || {}
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
    <Layout>
      <div className="flex min-h-screen flex-col px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">🌾 {t('appName')}</h1>
            <p className="mt-1 text-sm text-slate-400">{t('tagline')}</p>
          </div>
          <LanguageToggle />
        </div>

        {promptMessage && (
          <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
            {promptMessage}
          </div>
        )}

        <div className="card p-5">
          <form onSubmit={handleSubmit} className="flex-1">
            <InputField
              label={t('phone')}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              error={errors.phone}
              required
            />
            <InputField
              label={t('password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              required
            />
            <Button type="submit" loading={loading} className="mt-2 w-full">
              {t('login')}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-slate-400">
          {t('noAccount')}{' '}
          <Link to="/register" className="font-medium text-cyan-300">
            {t('register')}
          </Link>
        </p>
      </div>
    </Layout>
  )
}
