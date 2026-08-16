export default function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-white/10 ${className}`}
    />
  )
}

export function JobCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 sm:p-5">
      <div className="space-y-4">
        <Skeleton className="h-6 w-2/3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <Skeleton className="h-8 w-1/3" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-3 flex-1 rounded-full" />
          <Skeleton className="h-3 w-1/4 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function NotificationSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <Skeleton className="mx-auto h-24 w-24 rounded-full" />
        <Skeleton className="mx-auto mt-4 h-6 w-1/2" />
        <Skeleton className="mx-auto mt-2 h-4 w-1/3" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12" />
      <Skeleton className="h-12" />
      <Skeleton className="h-12" />
      <Skeleton className="h-10 w-1/3" />
    </div>
  )
}
