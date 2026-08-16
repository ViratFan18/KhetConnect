import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { getApiErrorMessage, showAppToast, unwrap } from '../services/api'
import { Button, InputField } from '../components/Layout'
import { mapBackendDetailsToMessages, validatePhone } from '../utils/validation'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [token, setToken] = useState('')

  const normalizedPhone = phone.replace(/\D/g, '')
  const isFormValid = validatePhone(normalizedPhone) === null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fieldErrors = {}
    const phoneError = validatePhone(normalizedPhone)

    if (phoneError) fieldErrors.phone = phoneError

    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { phone: normalizedPhone })
      const receivedToken = unwrap(res)
      showAppToast('Check your phone', 'success')
      setToken(String(receivedToken || ''))
      setTimeout(() => {
        window.location.href = `/reset-password?token=${encodeURIComponent(String(receivedToken || ''))}`
      }, 1200)
    } catch (err) {
      setErrors(mapBackendDetailsToMessages(err?.response?.data?.details || {}))
      showAppToast(getApiErrorMessage(err, 'Unable to send reset link'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell flex min-h-screen items-center justify-center px-3 py-6 sm:px-6">
      <div className="w-full max-w-md rounded-[2rem] border border-amber-400/20 bg-slate-950/85 p-5 shadow-[0_32px_100px_-40px_rgba(15,23,42,0.9)] backdrop-blur-sm sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/80">Recovery</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.06em] text-white">Reset password</h1>
          <p className="mt-2 text-sm text-slate-300">Enter your mobile number to generate a secure reset token.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label={t('phone')}
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => {
              const nextValue = e.target.value.replace(/\D/g, '').slice(0, 10)
              setPhone(nextValue)
              const nextError = validatePhone(nextValue)
              setErrors((prev) => {
                if (nextError) return { ...prev, phone: nextError }
                const { phone: _, ...rest } = prev
                return rest
              })
            }}
            placeholder="9876543210"
            error={errors.phone}
            required
          />

          {token && <p className="text-xs text-cyan-300">Code ready for reset</p>}

          <Button type="submit" loading={loading} disabled={!isFormValid || loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
            Send reset code
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between gap-2 text-sm">
          <Link to="/login" className="font-medium text-cyan-300 hover:text-cyan-200">Back to sign in</Link>
          <Link to="/register" className="font-medium text-amber-300 hover:text-amber-200">Create account</Link>
        </div>
      </div>
    </div>
  )
}
