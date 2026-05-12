'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PatientInfo } from '@/features/patients/components/PatientInfo'
import { TreatmentList } from '@/features/treatments/components/TreatmentList'
import { EvaluationList } from '@/features/evaluations/components/EvaluationList'
import { IcfTab } from '@/features/icf/components/IcfTab'
import { getPatient } from '@/lib/supabase/patients'
import type { Patient } from '@/features/patients/domain/types'

type PageProps = { params: Promise<{ id: string }> }

const VALID_TABS = new Set(['info', 'treatments', 'evaluations', 'icf'])

export default function PatientDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [patient, setPatient] = useState<Patient | null | undefined>(undefined)

  useEffect(() => {
    // Supabase에서 환자 fetch 후 동기화 — 외부 시스템 동기화
    async function load() {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPatient(await getPatient(id))
    }
    load()
  }, [id])

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

  if (patient === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        불러오는 중…
      </div>
    )
  }

  if (patient === null) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-3 p-4">
        <p className="text-sm text-muted-foreground">환자를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => router.push('/')}>
          환자 목록으로
        </Button>
      </div>
    )
  }

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
        <Button asChild variant="outline" size="sm"><Link href={`/patients/${patient.id}/edit`}><Pencil className="mr-1 h-4 w-4" />환자정보수정</Link></Button>
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
