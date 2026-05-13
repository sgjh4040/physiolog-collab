import { notFound } from 'next/navigation'
import { getPatient } from '@/lib/supabase/patients'
import { getTreatments } from '@/lib/supabase/treatments'
import { getEvaluations } from '@/lib/supabase/evaluations'
import { getIcfAssessments } from '@/lib/supabase/icf'
import { PatientDetailView } from '@/features/patients/components/PatientDetailView'

type PageProps = { params: Promise<{ id: string }> }

/**
 * Server Component — 환자 데이터 + 모든 탭 데이터를 서버에서 병렬 prefetch.
 * 자식 view는 'use client'지만 props를 받기만 하므로 client에서 다시 fetch하지 않음.
 * 결과: 클릭 직후 layout 즉시 표시 + 탭 전환 시에도 깜빡임 없이 즉시 콘텐츠 노출.
 */
export default async function PatientDetailPage({ params }: PageProps) {
  const { id } = await params

  // 환자 존재 확인이 우선 — 없으면 나머지 fetch는 의미 없음
  const patient = await getPatient(id)
  if (!patient) notFound()

  // 자식 탭 3개 데이터를 병렬로 prefetch (round-trip 1번에 처리)
  const [treatments, evaluations, icfAssessments] = await Promise.all([
    getTreatments(id),
    getEvaluations(id),
    getIcfAssessments(id),
  ])

  return (
    <PatientDetailView
      patient={patient}
      initialTreatments={treatments}
      initialEvaluations={evaluations}
      initialIcfAssessments={icfAssessments}
    />
  )
}
