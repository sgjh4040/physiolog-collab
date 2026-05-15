'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  title: string
  message: string
}

/**
 * 환자 요약지의 핵심을 카카오톡·문자 등으로 공유하는 버튼.
 *
 * - 모바일(navigator.share 지원): 시스템 공유 시트 → 카카오톡·문자·메일 선택
 * - 데스크톱·미지원: 클립보드 복사 + 토스트로 안내 (붙여넣기 가능)
 * - 사용자가 공유 시트를 닫으면 에러 X (AbortError 무시)
 */
export function ShareButton({ title, message }: Props) {
  const [busy, setBusy] = useState(false)

  async function handleShare() {
    if (busy) return
    setBusy(true)
    try {
      const canNativeShare =
        typeof navigator !== 'undefined' && typeof navigator.share === 'function'

      if (canNativeShare) {
        try {
          await navigator.share({ title, text: message })
          // 성공 토스트는 모바일 OS가 공유 시트 결과를 보여주므로 생략
          return
        } catch (err) {
          // 사용자가 공유 시트 닫음 → AbortError. 정상.
          if ((err as DOMException)?.name === 'AbortError') return
          // 그 외 에러는 클립보드로 폴백
        }
      }

      // 폴백: 클립보드 복사
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(message)
        toast.success('메시지가 복사되었습니다. 카카오톡에 붙여넣기 하세요.')
      } else {
        toast.error('이 브라우저는 공유·클립보드를 지원하지 않습니다.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleShare}
      disabled={busy}
      className="gap-1.5"
      aria-label="환자에게 공유"
    >
      <Share2 className="h-4 w-4" />
      공유
    </Button>
  )
}
