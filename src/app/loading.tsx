import { LoadingScreen } from '@/components/loading-screen'

/**
 * Root-level Suspense fallback.
 *
 * Server Component 페이지로 navigation할 때 (뒤로가기 포함) 서버 응답이
 * 도착하기 전까지 자동으로 표시됨. 'app/<route>/loading.tsx'가 더 specific하면
 * 그 파일이 우선 적용. 없으면 이 root loading이 fallback.
 *
 * 도입 이유:
 * - 사용자 제보: '환자 상세에서 뒤로가기 누르면 반응이 느림. 로딩 화면 있으면 좋겠음'
 * - 뒤로가기 = / (Server Component) 재진입 → 서버에서 patients/profile/latestDates
 *   다시 fetch하는 동안 시각 피드백이 0이라 사용자가 "안 눌렸다"고 느낌.
 */
export default function Loading() {
  return <LoadingScreen fullScreen />
}
