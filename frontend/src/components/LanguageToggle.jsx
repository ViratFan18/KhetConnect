import { useTranslation } from 'react-i18next'

export default function LanguageToggle() {
  const { i18n } = useTranslation()
  const isTelugu = i18n.language?.startsWith('te')

  const toggle = () => {
    const next = isTelugu ? 'en' : 'te'
    i18n.changeLanguage(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', next)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isTelugu ? 'Switch to English' : 'తెగు నుండి ఇంగ్లీష్‌కు మార్చండి'}
      className="inline-flex items-center rounded-full border border-primary/30 bg-white px-3 py-1.5 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary/5"
    >
      <span className="mr-2 text-xs uppercase tracking-wide">{isTelugu ? 'EN' : 'TE'}</span>
      <span>{isTelugu ? 'English' : 'తెలుగు'}</span>
    </button>
  )
}
