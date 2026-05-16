import { notFound } from 'next/navigation'
import { getPatient } from '@/lib/supabase/patients'
import { getTreatment } from '@/lib/supabase/treatments'
import { EditTreatmentView } from '@/features/treatments/components/EditTreatmentView'

type PageProps = { params: Promise<{ id: string; treatmentId: string }> }

/**
 * Server Component — 환자·치료 데이터를 SSR로 prefetch.
 * 이전 client + useEffect 패턴의 이중 로딩(skeleton → 스핀) 해소.
 * defaultValues에 methodDetails 누락 버그도 EditTreatmentView에서 정정.
 */
export default async function EditTreatmentPage({ params }: PageProps) {
  const { id: patientId, treatmentId } = await params
  const [patient, treatment] = await Promise.all([
    getPatient(patientId),
    getTreatment(treatmentId),
  ])
  if (!patient || !treatment) notFound()

  return <EditTreatmentView patient={patient} treatment={treatment} />
}
