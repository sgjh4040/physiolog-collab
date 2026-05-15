'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

/**
 * PWA Service Worker 업데이트 알림.
 *
 * 흐름:
 * 1. 페이지 로드 시 SW registration 조회
 * 2. 이미 waiting 상태인 SW가 있으면 즉시 토스트
 * 3. updatefound 이벤트 — 새 SW 설치 중. statechange === 'installed' + 기존 controller 있으면
 *    "기존 사용자가 새 버전 받음" 케이스 → 토스트
 * 4. 30분마다 registration.update()로 능동 체크 (앱을 오래 열어둔 사용자 대상)
 * 5. controllerchange 이벤트로 페이지 reload — 새 SW가 활성화되면 한 번만 새로고침
 *
 * dev에서는 next.config.ts의 disable 설정으로 SW가 생성 안 됨 → 토스트 절대 안 뜸.
 */
export function ServiceWorkerUpdateToast() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    let reloading = false

    const showUpdateToast = (registration: ServiceWorkerRegistration) => {
      toast('새 버전이 있어요 ✨', {
        description: '한 번의 새로고침으로 적용됩니다.',
        duration: Infinity,
        action: {
          label: '지금 업데이트',
          onClick: () => {
            registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
          },
        },
      })
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    })

    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting && navigator.serviceWorker.controller) {
        showUpdateToast(registration)
      }

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing
        if (!installing) return
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateToast(registration)
          }
        })
      })

      const intervalId = window.setInterval(() => {
        registration.update().catch(() => {})
      }, 30 * 60 * 1000)

      return () => window.clearInterval(intervalId)
    })
  }, [])

  return null
}
