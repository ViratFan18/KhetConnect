import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { getApiErrorMessage, showAppToast } from '../services/api'
import { Button, InputField } from '../components/Layout'
import { mapBackendDetailsToMessages, validateResetPasswordForm } from '../utils/validation'

export default function ResetPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const queryParams = new URLSearchParams(window.location.search)
  const token = queryParams.get('token') || ''

  const fieldErrors = validateResetPasswordForm({ token, newPassword, confirmPassword })
  const isFormValid = Object.keys(fieldErrors).length === 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = validateResetPasswordForm({ token, newPassword, confirmPassword })

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, newPassword })
      showAppToast('Password updated successfully', 'success')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        navigate('/login', { state: { successMessage: 'Password updated successfully. Please sign in.' } })
      }, 1200)
    } catch (err) {
      setErrors(mapBackendDetailsToMessages(err?.response?.data?.details || {}))
      showAppToast(getApiErrorMessage(err, 'Unable to update password'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell flex min-h-screen items-center justify-center px-3 py-6 sm:px-6">
      <div className="w-full max-w-md rounded-[2rem] border border-amber-400/20 bg-slate-950/85 p-5 shadow-[0_32px_100px_-40px_rgba(15,23,42,0.9)] backdrop-blur-sm sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">New password</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.06em] text-white">Set a secure password</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => {
              const nextValue = e.target.value
              setNewPassword(nextValue)
              const nextErrors = validateResetPasswordForm({ token, newPassword: nextValue, confirmPassword })
              setErrors((prev) => ({
                ...prev,
                ...nextErrors,
                newPassword: nextErrors.newPassword,
              }))
            }}
            error={errors.newPassword}
            required
          />
          <InputField
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              const nextValue = e.target.value
              setConfirmPassword(nextValue)
              const nextErrors = validateResetPasswordForm({ token, newPassword, confirmPassword: nextValue })
              setErrors((prev) => ({
                ...prev,
                ...nextErrors,
                confirmPassword: nextErrors.confirmPassword,
              }))
            }}
            error={errors.confirmPassword}
            required
          />

          {errors.token && <p className="text-sm text-rose-300">{errors.token}</p>}

          <Button type="submit" loading={loading} disabled={!isFormValid || loading} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
            Update password
          </Button>
        </form>

        <div className="mt-5 text-sm">
          <Link to="/login" className="font-medium text-cyan-300 hover:text-cyan-200">Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}
