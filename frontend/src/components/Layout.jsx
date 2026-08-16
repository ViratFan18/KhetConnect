import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import MotionWrapper from './MotionWrapper'

export default function Layout({ children }) {
  return (
    <div className="app-shell min-h-screen text-[var(--kc-text-primary)]">
      <div className="mx-auto min-h-screen max-w-7xl px-3 pb-28 sm:px-4 lg:px-6">
        <MotionWrapper className="min-h-screen">{children}</MotionWrapper>
      </div>
    </div>
  )
}

export function PageHeader({ title, backTo, subtitle, action }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 px-1 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          {backTo && (
            <button
              type="button"
              onClick={() => navigate(backTo)}
              className="oracle-secondary px-3 py-2 text-sm font-semibold"
            >
              ← {t('back')}
            </button>
          )}
          <h1 className="display-heading text-2xl font-bold text-[var(--kc-text-primary)] sm:text-3xl">{title}</h1>
        </div>
        {subtitle && <p className="mt-2 text-sm text-[var(--kc-text-secondary)]">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function Button({ children, loading, className = '', variant = 'primary', size = 'md', icon, ...props }) {
  const sizeClasses = {
    sm: 'min-h-9 min-w-[4rem] px-3 py-2 text-xs',
    md: 'min-h-12 min-w-[5rem] px-5 py-3 text-sm',
    lg: 'min-h-14 min-w-[6rem] px-6 py-4 text-base',
  }

  const baseClass = `inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${sizeClasses[size] || sizeClasses.md}`

  const variants = {
    primary: 'oracle-primary',
    secondary: 'oracle-secondary',
    success: 'border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-200 hover:border-emerald-400/50 hover:from-emerald-500/20 hover:to-emerald-600/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    warning: 'border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-amber-600/10 text-amber-200 hover:border-amber-400/50 hover:from-amber-500/20 hover:to-amber-600/20 shadow-[0_0_12px_rgba(217,119,6,0.15)]',
    danger: 'border border-rose-500/30 bg-gradient-to-r from-rose-500/10 to-rose-600/10 text-rose-200 hover:border-rose-400/50 hover:from-rose-500/20 hover:to-rose-600/20 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
    ghost: 'border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20',
    outline: 'border border-white/20 bg-transparent text-white hover:border-white/40 hover:bg-white/5',
  }

  const isDisabled = loading || props.disabled

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`${baseClass} ${variants[variant] || variants.primary} ${isDisabled ? 'cursor-not-allowed opacity-50 hover:opacity-50 hover:shadow-none' : ''} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex">{icon}</span>}
      {loading ? '⏳ Loading...' : children}
    </button>
  )
}

export const PrimaryButton = Button

export function InputField({ 
  label, 
  error, 
  helpText, 
  icon,
  rightSlot,
  variant = 'default',
  ...props 
}) {
  const fieldId = props.id || props.name || label
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={fieldId} className="mb-2 block text-sm font-semibold text-[var(--kc-text-secondary)]">
          {label}
          {props.required && <span className="ml-1 text-rose-300">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          id={fieldId}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          aria-required={props.required || undefined}
          className={`oracle-input px-4 py-3.5 ${icon ? 'pl-10' : ''} ${rightSlot ? 'pr-12' : ''} ${error ? 'border-red-500 bg-red-500/5' : ''}`}
          {...props}
        />
        {rightSlot}
      </div>
      {helpText && !error && <p className="mt-2 text-xs text-[var(--kc-text-muted)]">{helpText}</p>}
      {error && <p id={errorId} className="mt-2 text-sm text-rose-300">{error}</p>}
    </div>
  )
}

export function SelectField({ label, children, error, icon, ...props }) {
  const fieldId = props.id || props.name || label
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={fieldId} className="mb-2 block text-sm font-semibold text-[var(--kc-text-secondary)]">
          {label}
          {props.required && <span className="ml-1 text-rose-300">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </span>
        )}
        <select
          id={fieldId}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          aria-required={props.required || undefined}
          className={`oracle-input px-4 py-3.5 appearance-none ${icon ? 'pl-10' : ''} ${error ? 'border-red-500 bg-red-500/5' : ''}`}
          {...props}
        >
          {children}
        </select>
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          ▼
        </span>
      </div>
      {error && <p id={errorId} className="mt-2 text-sm text-rose-300">{error}</p>}
    </div>
  )
}

export function TextAreaField({ label, error, icon, ...props }) {
  const fieldId = props.id || props.name || label
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={fieldId} className="mb-2 block text-sm font-semibold text-[var(--kc-text-secondary)]">
          {label}
          {props.required && <span className="ml-1 text-rose-300">*</span>}
        </label>
      )}
      <textarea
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        aria-required={props.required || undefined}
        className={`oracle-input px-4 py-3.5 ${error ? 'border-red-500 bg-red-500/5' : ''}`}
        rows={4}
        {...props}
      />
      {error && <p id={errorId} className="mt-2 text-sm text-rose-300">{error}</p>}
    </div>
  )
}

export function StatusBadge({ status, size = 'md' }) {
  const classes = {
    REQUESTED: 'bg-amber-500/10 text-amber-300 border border-amber-400/15',
    PENDING: 'bg-amber-500/10 text-amber-300 border border-amber-400/15',
    APPROVED: 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/15',
    IN_PROGRESS: 'bg-cyan-500/10 text-cyan-300 border border-cyan-400/15',
    COMPLETED: 'bg-slate-500/10 text-slate-200 border border-slate-400/15',
    CANCELLED: 'bg-rose-500/10 text-rose-300 border border-rose-400/15',
    OPEN: 'bg-blue-500/10 text-blue-300 border border-blue-400/15',
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const badgeClass = `inline-flex items-center rounded-full font-semibold ${classes[status] || 'bg-slate-500/10 text-slate-200 border border-slate-400/15'} ${sizeClasses[size] || sizeClasses.md}`

  return <span className={badgeClass}>{status}</span>
}

export function Badge({ children, variant = 'slate', size = 'md' }) {
  const variants = {
    slate: 'bg-slate-500/10 text-slate-200 border border-slate-400/15',
    cyan: 'bg-cyan-500/10 text-cyan-200 border border-cyan-400/15',
    emerald: 'bg-emerald-500/10 text-emerald-200 border border-emerald-400/15',
    amber: 'bg-amber-500/10 text-amber-200 border border-amber-400/15',
    rose: 'bg-rose-500/10 text-rose-200 border border-rose-400/15',
    violet: 'bg-violet-500/10 text-violet-200 border border-violet-400/15',
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${variants[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  )
}

export function Chip({ children, onRemove, variant = 'default', icon }) {
  const baseClass = 'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium border transition'
  const variants = {
    default: 'bg-slate-900/60 border-white/10 text-white hover:border-white/20',
    active: 'bg-cyan-500/15 border-cyan-400/30 text-cyan-200',
    selected: 'bg-violet-500/15 border-violet-400/30 text-violet-200',
  }

  return (
    <div className={`${baseClass} ${variants[variant]}`}>
      {icon && <span>{icon}</span>}
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 rounded-full hover:bg-white/10 p-0.5"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="oracle-box relative overflow-hidden p-8 sm:p-12 text-center">
      <div className="absolute left-1/2 top-8 h-24 w-24 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.20),transparent_62%)] blur-2xl opacity-80"></div>
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-4xl text-violet-200 shadow-[0_20px_44px_-30px_rgba(139,92,246,0.8)]">{icon}</div>
      <p className="relative mt-5 text-xl font-semibold text-[var(--kc-text-primary)]">{title}</p>
      <p className="relative mt-3 text-sm text-[var(--kc-text-secondary)] max-w-sm mx-auto">{description}</p>
      {action && <div className="relative mt-6">{action}</div>}
    </div>
  )
}

export function Card({ children, className = '', variant = 'default' }) {
  const variants = {
    default: 'oracle-box',
    glass: 'rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm',
    elevated: 'rounded-xl border border-white/10 bg-slate-900/60 shadow-lg shadow-black/30',
  }

  return (
    <div className={`${variants[variant]} ${className}`}>
      {children}
    </div>
  )
}

export function Divider({ className = '' }) {
  return <div className={`h-px bg-gradient-to-r from-transparent via-white/10 to-transparent ${className}`} />
}
