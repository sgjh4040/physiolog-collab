import { notFound } from 'next/navigation'
import { getPatient } from '@/lib/supabase/patients'
import { getTreatments } from '@/lib/supabase/treatments'
import { getEvaluations } from '@/lib/supabase/evaluations'
import { getIcfAssessments } from '@/lib/supabase/icf'
import { getProfile } from '@/lib/supabase/actions'
import { PrintLayout } from '@/features/print/components/PrintLayout'
import { SummaryPrintTemplate } from '@/features/print/components/SummaryPrintTemplate'
import { ReferralPrintTemplate } from '@/features/print/components/ReferralPrintTemplate'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string }>
}

const VALID_TYPES = ['summary', 'referral'] as const
type PrintType = (typeof VALID_TYPES)[number]

const TITLES: Record<PrintType, string> = {
  summary: '환자용 요약지',
  referral: '물리치료 의뢰서',
}

/**
 * Print 페이지 (Server Component).
 * - ?type=summary  → 환자에게 주는 요약 카피
 * - ?type=referral → 의사·타 의료진 의뢰서
 *
 * 환자 + 치료 + 평가 + ICF 데이터 모두 server에서 병렬 prefetch.
 * PrintLayout이 화면에서는 A4 비율 미리보기로 보이게 하고
 * 인쇄(Cmd+P 또는 PDF 저장 버튼) 시 @media print CSS 적용.
 */
export default async function PrintPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { type: typeParam } = await searchParams

  const type: PrintType = (VALID_TYPES as readonly string[]).includes(typeParam ?? '')
    ? (typeParam as PrintType)
    : 'summary'

  const patient = await getPatient(id)
  if (!patient) notFound()

  const [treatments, evaluations, icfAssessments, profile] = await Promise.all([
    getTreatments(id),
    getEvaluations(id),
    getIcfAssessments(id),
    getProfile(),
  ])

  const authorName = profile?.name || profile?.email?.split('@')[0]
  const generatedAt = new Date().toISOString()

  return (
    <PrintLayout
      patientId={id}
      patientName={patient.name}
      documentTitle={TITLES[type]}
    >
      {type === 'summary' ? (
        <SummaryPrintTemplate
          patient={patient}
          treatments={treatments}
          evaluations={evaluations}
          generatedAt={generatedAt}
          authorName={authorName}
        />
      ) : (
        <ReferralPrintTemplate
          patient={patient}
          treatments={treatments}
          evaluations={evaluations}
          icfAssessments={icfAssessments}
          generatedAt={generatedAt}
          authorName={authorName}
        />
      )}
    </PrintLayout>
  )
}
