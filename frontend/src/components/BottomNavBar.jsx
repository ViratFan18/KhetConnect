import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'

const farmerLinks = [
  { to: '/farmer', labelKey: 'home', icon: '⌂' },
  { to: '/my-jobs', labelKey: 'myJobs', icon: '▣' },
  { to: '/post-job', labelKey: 'postJob', icon: '+' },
  { to: '/history', labelKey: 'workHistory', icon: '☰' },
  { to: '/profile', labelKey: 'profile', icon: '◍' },
]

const labourLinks = [
  { to: '/labourer', labelKey: 'home', icon: '⌂' },
  { to: '/nearby-jobs', labelKey: 'nearbyJobs', icon: '⌖' },
  { to: '/history', labelKey: 'workHistory', icon: '☰' },
  { to: '/profile', labelKey: 'profile', icon: '◍' },
]

export default function BottomNavBar() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { user } = useAuthStore()
  const links = user?.role === 'FARMER' ? farmerLinks : labourLinks

  return (
    <nav className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-1.25rem)] max-w-xl -translate-x-1/2">
      <div className="flex items-center justify-between gap-2 rounded-[1.4rem] border border-white/10 bg-slate-950/80 px-2 py-2 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
        {links.map(({ to, labelKey, icon }) => {
          const active = pathname === to || (to !== '/farmer' && to !== '/labourer' && pathname.startsWith(to))
          const activeClass = active
            ? 'bg-gradient-to-br from-violet-500/18 to-cyan-500/10 text-white border border-violet-400/20'
            : 'text-[var(--kc-text-secondary)] hover:text-[var(--kc-text-primary)]'

          return (
            <Link
              key={to}
              to={to}
              className={`flex min-h-[3.4rem] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[0.62rem] font-semibold transition ${activeClass}`}
            >
              <span className={`text-lg ${active ? 'text-violet-200' : ''}`}>{icon}</span>
              <span className="truncate">{t(labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
