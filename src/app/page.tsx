import { PatientList } from '@/features/patients/components/PatientList'
import { getPatients } from '@/lib/supabase/patients'
import { getLatestTreatmentDateMap } from '@/lib/supabase/treatments'
import { getProfile } from '@/lib/supabase/actions'

/**
 * Server Component — 환자 목록 + 마지막 치료일 + 사용자 프로필을 첫 응답에 포함시킴.
 *
 * 이전: PatientList(client)가 mount 후 useEffect에서 fetch.
 *   → 응답이 오기 전까지 같은 RSC pipeline의 navigation request
 *     (사용자의 카드 탭)이 큐잉되어 "안 눌리는" UX 버그 발생.
 *   → 사용자 단서: "마지막 치료 날짜 안 뜨면 카드 안 눌려짐"
 *   → 추가: "왼쪽 위 로그인 회원 정보가 한 타이밍 늦게 뜸 — layout shift"
 *
 * 지금: server에서 세 쿼리 await 후 prop 전달.
 *   → 사용자 첫 응답에 모든 데이터 포함 → client mount 시점부터 클릭 즉시 반응 + layout shift 0.
 *   → patients와 profile은 독립적이라 Promise.all로 병렬, latestDates는 patients에 의존해 sequential.
 */
export default async function Home() {
  const [patients, profile] = await Promise.all([getPatients(), getProfile()])

  const latestDates =
    patients.length > 0
      ? await getLatestTreatmentDateMap(patients.map((p) => p.id))
      : {}

  const initialUserProfile = profile
    ? {
        name: profile.name || profile.email?.split('@')[0] || '사용자',
        role: profile.role || '',
        workplace: profile.workplace || '',
      }
    : null

  return (
    <PatientList
      initialPatients={patients}
      initialLatestDates={latestDates}
      initialUserProfile={initialUserProfile}
    />
  )
}
