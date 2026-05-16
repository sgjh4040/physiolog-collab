import { notFound } from 'next/navigation'
import { getPatient } from '@/lib/supabase/patients'
import { EditPatientView } from '@/features/patients/components/EditPatientView'

type PageProps = { params: Promise<{ id: string }> }

/**
 * Server Component — 환자 데이터를 SSR로 prefetch → client view에 props로 전달.
 *
 * 이전: client component + useEffect fetch → /patients/[id]/loading.tsx의
 *   PatientDetailSkeleton 잠깐 → 흰 화면 잠깐 → LoadingScreen 스핀 → 폼.
 *   사용자 제보: "스켈레톤 빈화면 뜨다가 로딩스핀도 나오는것 같은데 정상인가"
 *
 * 지금: detail page와 동일하게 server prefetch → skeleton만 잠깐 보이고 폼 직행.
 *   client useEffect 제거로 이중 로딩 해소.
 */
export default async function EditPatientPage({ params }: PageProps) {
  const { id } = await params
  const patient = await getPatient(id)
  if (!patient) notFound()

  return <EditPatientView patient={patient} />
}
