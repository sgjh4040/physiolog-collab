/**
 * 공통 로딩 화면 컴포넌트.
 *
 * 사용 예:
 *   if (patient === undefined) return <LoadingScreen />
 *   if (isLoading) return <LoadingScreen fullScreen message="설정 불러오는 중…" />
 *
 * 모든 페이지의 로딩 표시를 통일해 디자인 일관성을 유지.
 * AuthGuard의 큰 진입 로딩과는 별도(앱 진입 vs 페이지 진입 의도가 다름).
 */

import { cn } from '@/lib/utils'

type Props = {
  /** 화면에 표시할 텍스트. 기본값: "불러오는 중…" */
  message?: string
  /** true면 화면 전체 높이를 차지. 페이지 진입 로딩에 적합. 기본값: false (부모 영역만) */
  fullScreen?: boolean
  className?: string
}

export function LoadingScreen({
  message = '불러오는 중…',
  fullScreen = false,
  className,
}: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-muted-foreground',
        fullScreen ? 'min-h-screen' : 'flex-1 py-16',
        className,
      )}
    >
      <div className="relative flex h-9 w-9 items-center justify-center">
        <span className="absolute h-full w-full animate-ping rounded-full bg-primary/15" />
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}
