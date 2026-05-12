import { notFound } from 'next/navigation'
import { getPatient } from '@/lib/supabase/patients'
import { PatientDetailView } from '@/features/patients/components/PatientDetailView'

type PageProps = { params: Promise<{ id: string }> }

/**
 * Server Component — 환자 데이터를 서버에서 직접 fetch.
 * 자식 view는 'use client'지만 patient prop을 받기만 하므로 client에서 다시 fetch하지 않음.
 * 결과: 클릭 직후 layout(헤더+탭)이 stream으로 즉시 표시되고, 풀스크린 LoadingScreen이 사라짐.
 */
export default async function PatientDetailPage({ params }: PageProps) {
  const { id } = await params
  const patient = await getPatient(id)
  if (!patient) notFound()

  return <PatientDetailView patient={patient} />
}
