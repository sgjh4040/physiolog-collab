import { PatientListSkeleton } from '@/features/patients/components/PatientListSkeleton'

/**
 * Root-level Suspense fallback — 환자 리스트(/)로 navigation 시 자동 표시.
 *
 * 이전엔 LoadingScreen(중앙 splash 텍스트)였지만 사용자가 "흰 화면" 직후 보는
 * 화면이 실제 컨텐츠와 다른 구조면 인지 부조화 발생. 환자 리스트 페이지의
 * 골격(헤더 + 필터 + 카드 N개)을 회색 placeholder로 미리 보여줘서 자리 잡고
 * 실제 데이터가 채워지는 흐름.
 *
 * `app/<route>/loading.tsx`가 더 specific하면 그 파일이 우선.
 */
export default function Loading() {
  return <PatientListSkeleton cardCount={6} />
}
