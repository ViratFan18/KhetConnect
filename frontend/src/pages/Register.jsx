import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { getApiErrorMessage, showAppToast, unwrap } from '../services/api'
import useAuthStore from '../store/authStore'
import LanguageToggle from '../components/LanguageToggle'
import Layout, { InputField, PrimaryButton } from '../components/Layout'

const SKILLS = ['HARVESTING', 'PLANTING', 'IRRIGATION', 'SPRAYING', 'OTHER']

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [role, setRole] = useState('FARMER')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [village, setVillage] = useState('')
  const [skills, setSkills] = useState([])
  const [dailyWage, setDailyWage] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const toggleSkill = (skill) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    const fieldErrors = {}
    const normalizedPhone = phone.replace(/\D/g, '')

    if (!name.trim()) fieldErrors.name = t('nameRequired')
    if (!normalizedPhone) {
      fieldErrors.phone = t('phoneRequired')
    } else if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      fieldErrors.phone = t('phoneInvalid')
    }
    if (!password.trim()) fieldErrors.password = t('passwordRequired')
    if (role === 'LABOURER' && skills.length === 0) fieldErrors.skills = t('skillsRequired')
    if (role === 'LABOURER' && dailyWage && Number(dailyWage) < 100) fieldErrors.dailyWageExpected = t('dailyWageMin')

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

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
      setErrors(err?.response?.data?.details || {})
      const message = getApiErrorMessage(err, t('registerFailed'))
      showAppToast(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">{t('register')}</h1>
          <LanguageToggle />
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-4 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.95)]">
          <form onSubmit={handleSubmit}>
            <p className="mb-2 text-sm font-medium text-slate-300">{t('role')}</p>
            <div className="mb-4 flex gap-2">
              {['FARMER', 'LABOURER'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 rounded-2xl border py-3 font-medium ${
                    role === r ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' : 'border-white/10 bg-slate-950/40 text-slate-300'
                  }`}
                >
                  {t(r.toLowerCase())}
                </button>
              ))}
            </div>

            <InputField label={t('name')} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} required />
            <InputField
              label={t('phone')}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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

            {role === 'FARMER' && (
              <InputField label={t('village')} value={village} onChange={(e) => setVillage(e.target.value)} error={errors.village} />
            )}

            {role === 'LABOURER' && (
              <>
                <p className="mb-2 text-sm font-medium text-slate-300">{t('skills')}</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {SKILLS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`rounded-full px-3 py-1.5 text-sm ${
                        skills.includes(skill)
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'border border-white/10 bg-slate-950/40 text-slate-300'
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
                  onChange={(e) => setDailyWage(e.target.value)}
                  error={errors.dailyWageExpected}
                  min={200}
                />
              </>
            )}

            <PrimaryButton type="submit" loading={loading}>
              {t('register')}
            </PrimaryButton>
          </form>
        </div>

        <p className="mt-6 text-center text-slate-400">
          {t('hasAccount')}{' '}
          <Link to="/login" className="font-medium text-cyan-300">
            {t('login')}
          </Link>
        </p>
      </div>
    </Layout>
  )
}
