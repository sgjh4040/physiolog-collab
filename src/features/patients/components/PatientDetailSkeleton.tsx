import { Skeleton } from '@/components/ui/skeleton'

/**
 * /patients/[id] 페이지의 골격. 헤더 + 4탭 + 본문 placeholder.
 * pointer-events-none + aria-busy로 사용자가 "준비 중"임을 인지하도록.
 */
function HeaderSkeleton() {
  return (
    <div className="flex items-start justify-between gap-3" aria-busy="true">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-7 w-24" />
      </div>
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </div>
  )
}

function TabsSkeleton() {
  return (
    <div className="flex w-full gap-1 rounded-md bg-slate-100 p-1" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-8 flex-1" />
      ))}
    </div>
  )
}

function ContentSkeleton() {
  return (
    <div className="space-y-3 pointer-events-none" aria-busy="true">
      <div className="rounded-lg border p-4 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="rounded-lg border p-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="rounded-lg border p-4 space-y-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

export function PatientDetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-2xl lg:max-w-3xl flex-1 flex-col gap-4 p-4 pb-24">
      <HeaderSkeleton />
      <TabsSkeleton />
      <ContentSkeleton />
    </div>
  )
}
