import { Skeleton } from '@/components/ui/skeleton'

/**
 * PatientCard 실제 레이아웃과 픽셀 단위 매칭 — swap 시 layout shift 0 목표.
 * pointer-events-none + aria-busy로 사용자가 "준비 중"임을 인지하도록.
 */
function PatientCardSkeleton() {
  return (
    <div
      className="rounded-lg border bg-card px-4 py-3 pointer-events-none"
      aria-busy="true"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-4 w-3/4" />
        </div>
        <div className="shrink-0 text-right space-y-1">
          <Skeleton className="ml-auto h-3 w-14" />
          <Skeleton className="ml-auto h-4 w-12" />
        </div>
      </div>
    </div>
  )
}

function HeaderSkeleton() {
  return (
    <div className="flex items-start justify-between gap-3" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-28 mt-3" />
      </div>
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </div>
  )
}

function FiltersSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-28" />
      </div>
      <Skeleton className="h-10 w-full rounded-full" />
    </div>
  )
}

export function PatientListSkeleton({ cardCount = 6 }: { cardCount?: number }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl lg:max-w-5xl flex-1 flex-col gap-4 p-4 pb-24 relative overflow-hidden">
      <HeaderSkeleton />
      <FiltersSkeleton />
      <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3 relative z-10 flex-1">
        {Array.from({ length: cardCount }).map((_, i) => (
          <PatientCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
