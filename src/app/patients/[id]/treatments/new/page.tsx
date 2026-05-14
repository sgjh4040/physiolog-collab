'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { TreatmentForm } from '@/features/treatments/components/TreatmentForm'
import {
  exerciseFavoritesStore,
} from '@/lib/storage'
import { getPatient } from '@/lib/supabase/patients'
import { getTreatment, getLatestTreatment, createTreatment } from '@/lib/supabase/treatments'
import type { TreatmentFormValues } from '@/features/treatments/domain/schema'
import type { Treatment } from '@/features/treatments/domain/types'
import { toISODate } from '@/lib/utils/date'
import type { Patient } from '@/features/patients/domain/types'
import { LoadingScreen } from '@/components/loading-screen'

type PageProps = { params: Promise<{ id: string }> }

export default function NewTreatmentPage({ params }: PageProps) {
  const { id: patientId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const copyFromId = searchParams.get('copyFrom')
  const copyMode = searchParams.get('copy') === '1' || !!copyFromId

  const [patient, setPatient] = useState<Patient | null | undefined>(undefined)
  const [defaults, setDefaults] = useState<Partial<TreatmentFormValues>>({})

  useEffect(() => {
    async function loadData() {
      setPatient(await getPatient(patientId))
      
      const copyFromId = searchParams.get('copyFrom')
      let sourceRecord: Treatment | null = null

      if (copyFromId) {
        sourceRecord = await getTreatment(copyFromId)
      } else if (copyMode) {
        sourceRecord = await getLatestTreatment(patientId)
      }

      if (sourceRecord) {
        setDefaults({
          date: toISODate(),
          bodyParts: sourceRecord.bodyParts.map((p) => ({
            region: p.region,
            side: p.side ?? 'both',
            muscles: p.muscles ?? [],
          })),
          methods: sourceRecord.methods,
          otherTreatmentMethod: sourceRecord.otherTreatmentMethod,
          exerciseConcept: sourceRecord.exerciseConcept,
          exercises: (sourceRecord.exercises ?? []).map((e) => ({
            id: e.id,
            name: e.name,
            intensity: e.intensity ?? '',
          })),
          homework: sourceRecord.homework ?? '',
          comment: sourceRecord.comment ?? '',
          flags: sourceRecord.flags ?? [],
        })
      }
    }
    loadData()
  }, [patientId, copyMode, searchParams])

  async function handleSubmit(values: TreatmentFormValues) {
    const result = await createTreatment({
      patientId,
      date: values.date,
      bodyParts: values.bodyParts,
      methods: values.methods,
      exerciseConcept: values.exerciseConcept,
      exercises: values.exercises,
      homework: values.homework,
      comment: values.comment,
      flags: values.flags,
    })
    
    if (!result.success) {
      toast.error('치료 기록 저장 실패', { description: result.error })
      return
    }
    // 운동 즐겨찾기 빈도 업데이트
    values.exercises.forEach((e) => exerciseFavoritesStore.recordExerciseUsage(e.name))
    toast.success(copyMode ? '복사 저장 완료' : '치료 저장됨')
    router.replace(`/patients/${patientId}?tab=treatments`)
    // 페이지 unmount까지 isSubmitting 유지 — 버튼 깜빡임 방지
    await new Promise(() => {})
  }

  if (patient === undefined) {
    return <LoadingScreen />
  }

  if (patient === null) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        환자를 찾을 수 없습니다.
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
      <header className="flex items-center gap-2">
        <Link
          href={`/patients/${patientId}?tab=treatments`}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">치료 {copyMode ? '복사' : '작성'}</h1>
          <p className="truncate text-sm text-muted-foreground">{patient.name}</p>
        </div>
        {copyMode && (
          <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs">
            <Copy className="h-3 w-3" />이전 기록 복사
          </span>
        )}
      </header>

      <TreatmentForm
        defaultValues={defaults}
        submitLabel={copyMode ? '복사 저장' : '저장'}
        onSubmit={handleSubmit}
        onCancel={() =>
          router.replace(`/patients/${patientId}?tab=treatments`)
        }
      />
    </div>
  )
}
