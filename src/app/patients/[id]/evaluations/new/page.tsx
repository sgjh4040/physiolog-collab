import { notFound } from 'next/navigation'
import { getPatient } from '@/lib/supabase/patients'
import { NewEvaluationView } from '@/features/evaluations/components/NewEvaluationView'

type PageProps = { params: Promise<{ id: string }> }

/**
 * Server Component — 환자 데이터 SSR prefetch.
 * 이전 client + useEffect + LoadingScreen 스핀 패턴을 server prefetch로 통일.
 */
export default async function NewEvaluationPage({ params }: PageProps) {
  const { id: patientId } = await params
  const patient = await getPatient(patientId)
  if (!patient) notFound()

  return <NewEvaluationView patient={patient} />
}
