import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageToggle from './LanguageToggle'
import NotificationBell from './NotificationBell'
import useAuthStore from '../store/authStore'

export default function Navbar({ showNotifications = true }) {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link
          to={user?.role === 'FARMER' ? '/farmer' : '/labourer'}
          className="flex items-center gap-3 rounded-[28px] border border-cyan-400/10 bg-slate-900/80 px-4 py-3 shadow-[0_20px_60px_-32px_rgba(56,189,248,0.65)] transition hover:border-cyan-300/40"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-lg shadow-[0_14px_30px_-16px_rgba(56,189,248,0.45)]">🌾</span>
          <span className="text-lg font-semibold text-white tracking-tight">{t('appName')}</span>
        </Link>
        <div className="flex items-center gap-2">
          {showNotifications && user && <NotificationBell />}
          <LanguageToggle />
          {user && (
            <button
              type="button"
              onClick={logout}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              {t('logout')}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
