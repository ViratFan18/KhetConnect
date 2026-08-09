import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Layout({ children }) {
  return (
    <div className="app-shell min-h-screen text-slate-100">
      <div className="mx-auto min-h-screen max-w-6xl px-4 pb-28">
        {children}
      </div>
    </div>
  )
}

export function PageHeader({ title, backTo, subtitle }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <div className="flex items-center gap-3">
        {backTo && (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="rounded-2xl border border-slate-700/60 bg-slate-950/80 px-3 py-2 text-sm text-cyan-300 transition hover:border-cyan-400 hover:text-white"
          >
            ← {t('back')}
          </button>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
      </div>
      {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
    </div>
  )
}

export function Button({ children, loading, className = '', variant = 'primary', ...props }) {
  const baseClass = 'inline-flex min-h-12 min-w-[5rem] items-center justify-center rounded-[28px] px-5 py-3 text-sm font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-60'
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-400 text-white shadow-[0_22px_60px_-30px_rgba(56,189,248,0.75)] hover:brightness-110',
    secondary: 'bg-slate-900/90 border border-slate-700/70 text-slate-100 hover:bg-slate-800/95',
    danger: 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-[0_18px_45px_-25px_rgba(239,68,68,0.7)] hover:brightness-110',
    ghost: 'bg-white/5 text-white border border-white/15 hover:bg-white/10',
  }

  return (
    <button type="button" disabled={loading || props.disabled} className={`${baseClass} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {loading ? 'Loading...' : children}
    </button>
  )
}

export const PrimaryButton = Button

export function InputField({ label, error, helpText, ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="mb-2 block text-sm font-semibold text-slate-300">
          {label}
          {props.required && <span className="ml-1 text-rose-300">*</span>}
        </label>
      )}
      <input
        aria-required={props.required || undefined}
        className={`w-full rounded-[28px] border px-5 py-3 text-slate-100 outline-none transition duration-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 ${error ? 'border-rose-400/80 bg-rose-500/10 text-white' : 'border-white/10 bg-slate-900/90'}`}
        {...props}
      />
      {helpText && !error && <p className="mt-2 text-xs text-slate-400">{helpText}</p>}
      {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
    </div>
  )
}

export function SelectField({ label, children, error, ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="mb-2 block text-sm font-semibold text-slate-300">
          {label}
          {props.required && <span className="ml-1 text-rose-300">*</span>}
        </label>
      )}
      <select
        aria-required={props.required || undefined}
        className={`w-full rounded-[28px] border px-5 py-3 text-slate-100 outline-none transition duration-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 ${error ? 'border-rose-400/80 bg-rose-500/10 text-white' : 'border-white/10 bg-slate-900/90'}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
    </div>
  )
}

export function TextAreaField({ label, error, ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="mb-2 block text-sm font-semibold text-slate-300">
          {label}
          {props.required && <span className="ml-1 text-rose-300">*</span>}
        </label>
      )}
      <textarea
        aria-required={props.required || undefined}
        className={`w-full rounded-[28px] border px-5 py-3 text-slate-100 outline-none transition duration-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 ${error ? 'border-rose-400/80 bg-rose-500/10 text-white' : 'border-white/10 bg-slate-900/90'}`}
        rows={3}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
    </div>
  )
}

export function StatusBadge({ status }) {
  const classes = {
    REQUESTED: 'bg-amber-500/15 text-amber-300',
    APPROVED: 'bg-emerald-500/15 text-emerald-300',
    IN_PROGRESS: 'bg-cyan-500/15 text-cyan-300',
    COMPLETED: 'bg-slate-700/15 text-slate-200',
    CANCELLED: 'bg-rose-500/15 text-rose-300',
    OPEN: 'bg-blue-500/15 text-blue-300',
  }

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classes[status] || 'bg-slate-700/15 text-slate-200'}`}>{status}</span>
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="rounded-[32px] border border-slate-700/60 bg-slate-950/90 p-8 text-center shadow-[0_30px_80px_-40px_rgba(15,23,42,0.9)]">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-900/90 text-4xl text-cyan-300 shadow-[0_20px_50px_-30px_rgba(56,189,248,0.5)]">{icon}</div>
      <p className="mt-5 text-xl font-semibold text-white">{title}</p>
      <p className="mt-3 text-sm text-slate-400">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

