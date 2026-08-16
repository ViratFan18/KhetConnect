import { Link } from 'react-router-dom'

const ERROR_ICONS = {
  server: '⚠️',
  unauthorized: '🔒',
  notfound: '🔍',
  forbidden: '🚫',
  default: '😔',
}

export default function ErrorPage({ 
  title, 
  message, 
  buttonText = 'Go home', 
  link = '/',
  type = 'default',
  subtitle = '',
  details = '',
}) {
  const icon = ERROR_ICONS[type] || ERROR_ICONS.default
  
  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 flex flex-col items-center justify-center px-4 py-10 sm:px-6">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.5),transparent_80%)] pointer-events-none" />
      
      {/* Premium error card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-sm p-8 sm:p-10 shadow-2xl shadow-black/40">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-slate-700/30 rounded-full blur-xl"></div>
              <span className="relative block text-6xl sm:text-7xl">{icon}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-2 text-center text-3xl sm:text-4xl font-bold tracking-[-0.04em] text-white">
            {title}
          </h1>

          {/* Subtitle (optional) */}
          {subtitle && (
            <p className="text-center text-sm font-semibold uppercase tracking-[0.12em] text-slate-400 mb-4">
              {subtitle}
            </p>
          )}

          {/* Main message */}
          <p className="mb-6 text-center text-base text-slate-300">
            {message}
          </p>

          {/* Details (optional) */}
          {details && (
            <div className="mb-6 rounded-lg border border-white/10 bg-slate-950/50 p-4">
              <p className="text-xs font-mono text-slate-400">{details}</p>
            </div>
          )}

          {/* Action button */}
          <Link 
            to={link} 
            className="block w-full rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 py-3 text-center font-semibold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:from-cyan-500 hover:to-cyan-400 transition-all duration-200"
          >
            {buttonText}
          </Link>

          {/* Secondary action (optional) */}
          {type === 'unauthorized' && (
            <Link
              to="/login"
              className="mt-3 block w-full rounded-xl border border-white/10 bg-slate-900/50 px-6 py-3 text-center font-semibold text-slate-200 hover:bg-slate-900/80 transition"
            >
              Sign in instead
            </Link>
          )}
        </div>

        {/* Help text */}
        <p className="mt-6 text-center text-sm text-slate-400">
          Need help? <Link to="/" className="text-cyan-400 hover:text-cyan-300 transition">Contact support</Link>
        </p>
      </div>
    </div>
  )
}
