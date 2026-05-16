import { notFound } from 'next/navigation'
import { getPatient } from '@/lib/supabase/patients'
import {
  getTreatment,
  getLatestTreatment,
} from '@/lib/supabase/treatments'
import { NewTreatmentView } from '@/features/treatments/components/NewTreatmentView'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ copyFrom?: string; copy?: string }>
}

/**
 * Server Component — 환자 + (복사 모드면) 소스 치료를 SSR로 prefetch.
 * 이전 client + useEffect 패턴의 이중 로딩(skeleton → 스핀) 해소.
 *
 * 복사 모드 분기:
 * - ?copyFrom={treatmentId} → 특정 치료 1건 복사
 * - ?copy=1 → 최근 치료 1건 자동 복사
 * - 둘 다 없음 → 빈 폼
 */
export default async function NewTreatmentPage({ params, searchParams }: PageProps) {
  const { id: patientId } = await params
  const sp = await searchParams
  const copyFromId = sp.copyFrom
  const copyMode = sp.copy === '1' || !!copyFromId

  const [patient, sourceRecord] = await Promise.all([
    getPatient(patientId),
    copyFromId
      ? getTreatment(copyFromId)
      : copyMode
        ? getLatestTreatment(patientId)
        : Promise.resolve(null),
  ])
  if (!patient) notFound()

  return (
    <NewTreatmentView
      patient={patient}
      sourceRecord={sourceRecord ?? null}
      copyMode={copyMode}
    />
  )
}
