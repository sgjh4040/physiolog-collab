import { notFound } from 'next/navigation'
import { getPatient } from '@/lib/supabase/patients'
import { getEvaluation } from '@/lib/supabase/evaluations'
import { NewEvaluationView } from '@/features/evaluations/components/NewEvaluationView'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ copyFrom?: string }>
}

/**
 * Server Component — 환자 + (복사 모드면) 소스 검사를 SSR로 prefetch.
 *
 * 복사 모드: ?copyFrom={evaluationId} → 해당 검사 1건의 측정 항목을 그대로 prefill.
 *            날짜는 prefill 단계에서 오늘 날짜로 갱신됨 (재평가).
 */
export default async function NewEvaluationPage({ params, searchParams }: PageProps) {
  const { id: patientId } = await params
  const sp = await searchParams
  const copyFromId = sp.copyFrom

  const [patient, sourceRecord] = await Promise.all([
    getPatient(patientId),
    copyFromId ? getEvaluation(copyFromId) : Promise.resolve(null),
  ])
  if (!patient) notFound()

  return (
    <NewEvaluationView
      patient={patient}
      sourceRecord={sourceRecord ?? null}
      copyMode={!!copyFromId}
    />
  )
}
