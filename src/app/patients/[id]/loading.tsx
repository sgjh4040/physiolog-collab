import { PatientDetailSkeleton } from '@/features/patients/components/PatientDetailSkeleton'

/**
 * /patients/[id] navigation 시 자동 표시되는 골격.
 * 헤더 + 4탭 + 본문 placeholder로 카드 클릭 직후 흰 화면 제거.
 */
export default function Loading() {
  return <PatientDetailSkeleton />
}
