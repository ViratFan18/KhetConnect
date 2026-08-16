import { useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { VariableSizeList } from 'react-window'
import api, { unwrap } from '../services/api'
import Navbar from '../components/Navbar'
import BottomNavBar from '../components/BottomNavBar'
import JobCard from '../components/JobCard'
import Layout, { PrimaryButton } from '../components/Layout'
import { getCurrentLocation, updateUserLocation } from '../utils/location'
import { JobCardSkeleton } from '../components/Skeleton'
import { queryKeys } from '../queryKeys'

const FILTERS = ['ALL', 'HARVESTING', 'PLANTING', 'IRRIGATION', 'SPRAYING', 'WEEDING', 'OTHER']

export default function NearbyJobs() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('ALL')
  const [locationError, setLocationError] = useState(false)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const listRef = useRef(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useInfiniteQuery({
    queryKey: [...queryKeys.jobs.nearby],
    staleTime: 30_000,
    initialPageParam: '0',
    enabled: locationEnabled,
    queryFn: async ({ pageParam = '0' }) => {
      setLocationError(false)
      const { lat, lng } = await getCurrentLocation()
      await updateUserLocation(lat, lng)
      const res = await api.get('/jobs/nearby', { params: { lat, lng, cursor: pageParam, pageSize: 20 } })
      return unwrap(res) || { items: [], nextCursor: null }
    },
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    retry: 1,
    onError: () => setLocationError(true),
  })

  const handleEnableLocation = async () => {
    setLocationError(false)
    setLocationEnabled(true)
    await refetch()
  }

  const jobs = useMemo(() => data?.pages.flatMap((page) => page.items || []) ?? [], [data])
  const filtered = useMemo(() => (filter === 'ALL' ? jobs : jobs.filter((j) => j.workType === filter)), [jobs, filter])

  const applyMutation = useMutation({
    mutationFn: async ({ jobId }) => {
      const res = await api.post(`/jobs/${jobId}/apply`, null, { suppressErrorToast: true })
      return unwrap(res)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.jobs.nearby })
      await queryClient.invalidateQueries({ queryKey: queryKeys.jobs.myPosts })
    },
  })

  const loadJobs = async () => {
    await refetch()
  }

  const listHeight = 620
  const itemHeight = 400

  return (
    <Layout>
      <Navbar />
      <div className="px-3 py-6 sm:px-4">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/8 via-slate-950 to-slate-950 p-6 sm:p-8 shadow-[0_20px_60px_-35px_rgba(34,211,238,0.3)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_30%)]" />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">{t('nearbyJobs')}</p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl">{t('oneTapApply')}</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-300">Discover verified jobs near you. Apply to work, get accepted, and start earning today.</p>
          </div>
        </div>

        {/* Filter & Refresh */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex-1 overflow-x-auto">
            <div className="mb-2 flex gap-2 pb-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    filter === f
                      ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                      : 'border-white/10 bg-slate-900/40 text-slate-300 hover:border-white/20 hover:bg-slate-900/60'
                  }`}
                >
                  {f === 'ALL' ? t('filterAll') : t(f.toLowerCase())}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={loadJobs}
            className={`shrink-0 rounded-xl border border-white/10 bg-slate-900/40 px-4 py-2.5 font-semibold text-white hover:bg-slate-900/60 transition ${isLoading ? 'opacity-60' : ''}`}
          >
            <span className={`mr-2 inline-block ${isLoading ? 'animate-spin' : ''}`}>🔄</span>
            {t('refresh')}
          </button>
        </div>

        {/* Job Feed */}
        <div className="mt-6">
          {isLoading ? (
            <div className="space-y-3">
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </div>
          ) : (!locationEnabled || locationError) ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-500/12 p-8 text-center">
              <span className="text-4xl">📍</span>
              <p className="mt-3 text-lg font-semibold text-rose-200">{t('locationDenied')}</p>
              <p className="mt-1 text-sm text-rose-200/70">Enable location to discover nearby jobs.</p>
              <button
                onClick={handleEnableLocation}
                className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/12 px-5 py-2.5 font-semibold text-rose-200 hover:bg-rose-500/20"
              >
                {t('retry')}
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-center">
              <span className="text-4xl">🌾</span>
              <p className="mt-3 text-lg font-semibold text-white">{t('noJobsNearby')}</p>
              <p className="mt-1 text-sm text-slate-400">No jobs match your filter. Try refreshing or changing the work type.</p>
            </div>
          ) : (
            <div style={{ height: listHeight }}>
              <VariableSizeList
                ref={listRef}
                height={listHeight}
                itemCount={filtered.length + (isFetchingNextPage ? 1 : 0)}
                itemSize={() => itemHeight}
                width="100%"
                overscanCount={3}
                onItemsRendered={({ visibleStopIndex }) => {
                  if (visibleStopIndex >= filtered.length - 3 && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage()
                  }
                }}
              >
                {({ index, style }) => {
                  if (index >= filtered.length) {
                    return (
                      <div style={style} className="pr-1">
                        <JobCardSkeleton />
                      </div>
                    )
                  }

                  const job = filtered[index]
                  return (
                    <div style={style} className="pr-1">
                      <JobCard
                        key={job.id}
                        job={job}
                        onApplySuccess={() => {
                          queryClient.invalidateQueries({ queryKey: queryKeys.jobs.nearby })
                          queryClient.invalidateQueries({ queryKey: queryKeys.jobs.myPosts })
                        }}
                        onApplyMutation={applyMutation}
                      />
                    </div>
                  )
                }}
              </VariableSizeList>
            </div>
          )}
        </div>
      </div>
      <BottomNavBar />
    </Layout>
  )
}
