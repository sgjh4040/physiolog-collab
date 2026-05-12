'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PatientInfo } from '@/features/patients/components/PatientInfo'
import { TreatmentList } from '@/features/treatments/components/TreatmentList'
import { EvaluationList } from '@/features/evaluations/components/EvaluationList'
import { IcfTab } from '@/features/icf/components/IcfTab'
import type { Patient } from '@/features/patients/domain/types'

const VALID_TABS = new Set(['info', 'treatments', 'evaluations', 'icf'])

type Props = { patient: Patient }

/**
 * 환자 상세 페이지의 인터랙션 부분 (탭 전환, URL 동기화).
 * 데이터 fetch는 server component(page.tsx)에서 처리하므로 여기서는 prop으로만 받음.
 * 그 결과 layout(헤더+탭)이 stream으로 즉시 보임 → 클릭 후 풀스크린 LoadingScreen 사라짐.
 */
export function PatientDetailView({ patient }: Props) {
  const searchParams = useSearchParams()

  const tabFromUrl = searchParams.get('tab')
  const initialTab = tabFromUrl && VALID_TABS.has(tabFromUrl) ? tabFromUrl : 'info'
  const [tab, setTab] = useState(initialTab)

  useEffect(() => {
    // URL search param 변경 시 탭 동기화 — 외부(URL) → 내부 state
    if (tabFromUrl && VALID_TABS.has(tabFromUrl) && tabFromUrl !== tab) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab(tabFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabFromUrl])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 pb-8">
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/"
            aria-label="뒤로"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="truncate text-xl font-semibold">{patient.name}</h1>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/patients/${patient.id}/edit`}>
            <Pencil className="mr-1 h-4 w-4" />환자정보수정
          </Link>
        </Button>
      </header>

      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex flex-1 flex-col gap-4"
      >
        <TabsList className="w-full">
          <TabsTrigger value="info" className="flex-1">
            기본정보
          </TabsTrigger>
          <TabsTrigger value="treatments" className="flex-1">
            치료
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="flex-1">
            검사
          </TabsTrigger>
          <TabsTrigger value="icf" className="flex-1">
            평가
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <PatientInfo patient={patient} />
        </TabsContent>

        <TabsContent value="treatments">
          <TreatmentList patientId={patient.id} />
        </TabsContent>

        <TabsContent value="evaluations">
          <EvaluationList patientId={patient.id} />
        </TabsContent>

        <TabsContent value="icf">
          <IcfTab patientId={patient.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
