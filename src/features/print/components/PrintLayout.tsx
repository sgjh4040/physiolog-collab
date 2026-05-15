'use client'

import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShareButton } from './ShareButton'

/**
 * Print-aware A4 wrapper.
 *
 * - 화면에서는 회색 배경에 A4 비율 흰 종이가 떠있는 모양 (미리보기처럼)
 * - 상단 toolbar에 [뒤로] + [공유?] + [PDF 저장] — `@media print`로 인쇄 시 숨김
 * - 인쇄 시에는 children만 A4 페이지로 렌더링 (벡터 PDF로 변환됨)
 *
 * children 안에서 `.print-page` 클래스로 페이지 분할,
 * `.no-print` 클래스로 인쇄 제외 가능.
 */
type Props = {
  patientId: string
  patientName: string
  documentTitle: string
  children: React.ReactNode
  /**
   * 환자에게 카카오톡·문자로 보낼 메시지. 있으면 toolbar에 [공유] 버튼 노출.
   * 환자용 요약지(summary) 타입에서만 전달, 의뢰서(referral)에선 undefined.
   */
  shareMessage?: string
}

export function PrintLayout({
  patientId,
  patientName,
  documentTitle,
  children,
  shareMessage,
}: Props) {
  return (
    <div className="min-h-screen bg-muted/40">
      {/* 인쇄 시 자동 적용되는 페이지 메타 — page size, 여백, 색상 강제 표시 */}
      <style jsx global>{`
        @page {
          size: A4;
          margin: 15mm 15mm 18mm 15mm;
        }
        @media print {
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print { display: none !important; }
          .print-page {
            width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            page-break-after: always;
          }
          .print-page:last-of-type { page-break-after: auto; }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
          /* 인쇄 시 색상 강제 — 잉크 절약 모드가 회색조로 만들지 않게 */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        @media screen {
          .print-page {
            width: 210mm;
            min-height: 297mm;
            margin: 24px auto;
            padding: 15mm;
            background: white;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border-radius: 4px;
            color: #1a1a1a;
            font-size: 11pt;
            line-height: 1.6;
          }
        }
        /*
         * 모바일에서는 A4 종이(210mm ≈ 794px)가 viewport보다 커서
         * 가로 스크롤 발생. transform: scale은 layout box를 안 줄여서
         * 잘림 문제 남음 → A4 고정폭을 풀고 viewport 폭에 맞춰 흐름.
         * 인쇄 시(@media print 별도)에는 영향 없음 — A4 PDF 그대로.
         */
        @media screen and (max-width: 500px) {
          .print-page-wrapper {
            overflow-x: hidden;
          }
          .print-page {
            width: auto;
            max-width: calc(100vw - 16px);
            min-height: auto;
            margin: 12px 8px;
            padding: 10mm 8mm;
            font-size: 9.5pt;
            line-height: 1.5;
          }
          .print-page table {
            font-size: 9pt;
          }
        }
      `}</style>

      {/* 화면 전용 toolbar */}
      <div className="no-print sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
          <Link
            href={`/patients/${patientId}`}
            aria-label="뒤로"
            className="flex h-9 items-center gap-1 rounded-md px-2 text-sm text-muted-foreground transition hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{patientName} 차트로</span>
            <span className="sm:hidden">뒤로</span>
          </Link>

          <div className="min-w-0 flex-1 truncate text-center text-sm font-medium">
            {documentTitle}
          </div>

          <div className="flex items-center gap-1.5">
            {shareMessage && (
              <ShareButton title={`${patientName}님 운동 안내`} message={shareMessage} />
            )}
            <Button
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 shadow-sm"
            >
              <Printer className="h-4 w-4" />
              PDF 저장
            </Button>
          </div>
        </div>
        <p className="no-print mx-auto max-w-3xl px-4 pb-2 text-center text-[11px] text-muted-foreground">
          인쇄 다이얼로그에서 <strong>“PDF로 저장”</strong>을 선택하면 파일로 받을 수 있습니다.
        </p>
      </div>

      {/* 인쇄될 내용 */}
      <div className="mx-auto pb-12 print-page-wrapper">
        {children}
      </div>
    </div>
  )
}
