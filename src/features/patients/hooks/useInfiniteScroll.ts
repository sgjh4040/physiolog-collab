'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * sentinel 기반 무한 스크롤 훅.
 *
 * IntersectionObserver 대신 scroll event + rAF throttle을 쓰는 이유:
 * IO는 등록 직후 자동 fire는 무시할 수 있어도 사용자가 한 번에 바닥까지
 * 스크롤하면 sentinel이 줄곧 viewport 안에 머무르며 '상태 변화'가 없어
 * 추가 fire가 발생하지 않음. scroll listener는 매 frame마다 위치 재계산.
 *
 * sentinel은 `visibleCount < totalCount`일 때만 렌더해야 함 (호출 측 책임).
 * 다 보이면 sentinelRef.current === null → 조기 return으로 skip.
 *
 * @param totalCount 전체 항목 수 (visibleCount 리셋 트리거)
 * @param resetDeps visibleCount를 PAGE_SIZE로 리셋할 의존성 배열
 *                  (검색어·탭·정렬이 바뀌면 첫 페이지로 돌아가기 위함)
 * @param pageSize 한 번에 추가로 렌더링할 항목 수
 */
export function useInfiniteScroll({
  totalCount,
  resetDeps,
  pageSize,
}: {
  totalCount: number
  resetDeps: unknown[]
  pageSize: number
}): {
  visibleCount: number
  sentinelRef: RefObject<HTMLDivElement | null>
} {
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      const sentinel = sentinelRef.current
      if (!sentinel) return
      ticking = true
      requestAnimationFrame(() => {
        const rect = sentinel.getBoundingClientRect()
        if (rect.top < window.innerHeight + 100) {
          setVisibleCount((c) => Math.min(c + pageSize, totalCount))
        }
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pageSize, totalCount])

  return { visibleCount, sentinelRef }
}
