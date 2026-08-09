export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
}

export function JobCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="mb-2 h-4 w-1/4" />
      <Skeleton className="mb-2 h-8 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}
