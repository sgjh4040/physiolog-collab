'use client'

import { useEffect } from 'react'

/**
 * Hydrate 직후 layout.tsx에 박힌 `<div id="initial-splash">`를 제거.
 *
 * SSR 단계에서는 splash가 화면을 덮고 있고(React 미장착), client mount 직후 사라짐.
 * PWA cold start 흰 frame을 메우는 용도 — manifest background_color(다크) +
 * 인라인 splash가 합쳐져 사용자 체감 흰 화면 0초.
 *
 * AuthGuard splash(인용구 + 로딩)는 이후 isVerified 확인 중에 표시되어 자연스러운 인계.
 */
export function RemoveInitialSplash() {
  useEffect(() => {
    const el = document.getElementById('initial-splash')
    if (el) el.remove()
  }, [])
  return null
}
