import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'

const farmerLinks = [
  { to: '/farmer', labelKey: 'home', icon: '🏠' },
  { to: '/post-job', labelKey: 'postJob', icon: '➕' },
  { to: '/my-jobs', labelKey: 'myJobs', icon: '📋' },
  { to: '/history', labelKey: 'workHistory', icon: '📜' },
  { to: '/profile', labelKey: 'profile', icon: '👤' },
]

const labourLinks = [
  { to: '/labourer', labelKey: 'home', icon: '🏠' },
  { to: '/nearby-jobs', labelKey: 'nearbyJobs', icon: '📍' },
  { to: '/history', labelKey: 'workHistory', icon: '📜' },
  { to: '/profile', labelKey: 'profile', icon: '👤' },
]

export default function BottomNavBar() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { user } = useAuthStore()
  const links = user?.role === 'FARMER' ? farmerLinks : labourLinks

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-[0_-18px_60px_-45px_rgba(0,0,0,0.9)]">
      <div className="mx-auto flex max-w-6xl justify-between gap-3 px-4 py-3">
        {links.map(({ to, labelKey, icon }) => {
          const active = pathname === to || (to !== '/farmer' && to !== '/labourer' && pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className={`flex min-h-[62px] min-w-[62px] flex-1 flex-col items-center justify-center gap-1 rounded-[28px] px-3 text-[10px] font-semibold transition duration-200 ${
                active
                  ? 'bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-slate-900 text-cyan-100 shadow-[0_18px_36px_-18px_rgba(56,189,248,0.45)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-xl">{icon}</span>
              <span className="truncate">{t(labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
