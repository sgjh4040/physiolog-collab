'use client'

import { useEffect, useState } from 'react'

/**
 * PWA cold start 흰 frame을 메우는 splash.
 *
 * **중요**: 이 컴포넌트는 React state 기반으로 unmount. 직접 `el.remove()`로 DOM
 * 노드를 제거하면 React virtual DOM과 실제 DOM이 어긋나 후속 navigation의
 * insertBefore/removeChild가 실패 ("This page couldn't load") 함.
 *
 * 흐름:
 *   SSR: show=true → splash 포함된 HTML 응답
 *   Client mount: 첫 렌더는 SSR과 동일 (show=true, hydration mismatch 0)
 *   useEffect: setShow(false) → re-render → null → React가 정상 unmount
 *
 * manifest background_color(#1c1c1c)와 같은 톤이라 시스템 splash → 이 컴포넌트 →
 * AuthGuard splash로 자연스럽게 인계됨.
 */
export function InitialSplash() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Hydrate 직후 사라짐. 사용자 체감으로는 SSR splash가 client에 인수됐다가 즉시 fade out.
    setShow(false)
  }, [])

  if (!show) return null

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-background text-foreground px-6"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-base font-medium italic text-center max-w-xs leading-relaxed break-keep text-foreground/80">
        &ldquo;정확한 평가는 치료의 가장 정직한 지도(Map)가 됩니다.&rdquo;
      </p>
    </div>
  )
}
