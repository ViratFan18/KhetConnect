import React from 'react'
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
      className="inline-flex items-center rounded-full border border-slate-600 bg-slate-900/90 px-3 py-1.5 text-sm font-semibold text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-800"
    >
      <span className="mr-2 text-[10px] uppercase tracking-[0.16em] text-cyan-300">{isTelugu ? 'EN' : 'TE'}</span>
      <span>{isTelugu ? 'English' : 'తెలుగు'}</span>
    </button>
  )
}
