import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getPatient } from '@/lib/supabase/patients'
import { getEvaluations } from '@/lib/supabase/evaluations'
import { IcfAssessmentForm } from '@/features/icf/components/IcfAssessmentForm'

type PageProps = { params: Promise<{ id: string }> }

/**
 * Server Component — 환자 + 시계열 평가 SSR prefetch.
 *
 * 이전: client + 폼 내부 useEffect에서 getPatient/getEvaluations.
 *   PatientDetailSkeleton 후 폼 영역이 빈 상태로 잠깐 마운트되고 환자 이름·
 *   AI 컨텍스트 데이터가 한 박자 늦게 채워짐.
 *
 * 지금: server에서 Promise.all 병렬 prefetch → 폼이 처음부터 데이터 있는
 *   상태로 마운트. edit/new 페이지 server prefetch 패턴 일관성 완성.
 */
export default async function IcfNewPage({ params }: PageProps) {
  const { id } = await params
  const [patient, evaluations] = await Promise.all([
    getPatient(id),
    getEvaluations(id),
  ])
  if (!patient) notFound()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 pb-8">
      <header className="flex items-center gap-2">
        <Link
          href={`/patients/${id}?tab=icf`}
          aria-label="뒤로"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold">평가지</h1>
          <p className="text-xs text-muted-foreground">임상 추론 보조</p>
        </div>
      </header>

      <IcfAssessmentForm
        patientId={id}
        initialPatient={patient}
        initialEvaluations={evaluations}
      />
    </div>
  )
}
