import { notFound } from 'next/navigation'
import { getPatient } from '@/lib/supabase/patients'
import { getEvaluation } from '@/lib/supabase/evaluations'
import { EditEvaluationView } from '@/features/evaluations/components/EditEvaluationView'

type PageProps = { params: Promise<{ id: string; evaluationId: string }> }

/**
 * Server Component — 환자·검사 데이터를 SSR로 prefetch.
 * 환자·치료 수정 페이지와 동일 패턴으로 통일. 이중 로딩(skeleton → 스핀) 해소.
 */
export default async function EditEvaluationPage({ params }: PageProps) {
  const { id: patientId, evaluationId } = await params
  const [patient, evaluation] = await Promise.all([
    getPatient(patientId),
    getEvaluation(evaluationId),
  ])
  if (!patient || !evaluation) notFound()

  return <EditEvaluationView patient={patient} evaluation={evaluation} />
}
