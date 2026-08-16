import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageToggle from './LanguageToggle'
import NotificationBell from './NotificationBell'
import useAuthStore from '../store/authStore'

export default function Navbar({ showNotifications = true }) {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()

  return (
    <header className="oracle-bar">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
        <Link
          to={user?.role === 'FARMER' ? '/farmer' : '/labourer'}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/3 px-3 py-2.5 transition hover:border-violet-400/30"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-base shadow-[0_16px_28px_-14px_rgba(139,92,246,0.9)]">K</span>
          <span className="display-heading text-base font-bold tracking-[-0.04em] text-[var(--kc-text-primary)] sm:text-lg">{t('appName')}</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {showNotifications && user && <NotificationBell />}
          <LanguageToggle />
          {user && (
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-slate-600 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-800 sm:text-sm"
            >
              {t('logout')}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
