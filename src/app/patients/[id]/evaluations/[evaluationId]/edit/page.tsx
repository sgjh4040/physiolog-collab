'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { EvaluationForm } from '@/features/evaluations/components/EvaluationForm'
import { getPatient } from '@/lib/supabase/patients'
import { getEvaluation, updateEvaluation } from '@/lib/supabase/evaluations'
import type { EvaluationFormValues } from '@/features/evaluations/domain/schema'
import type { Patient } from '@/features/patients/domain/types'
import type { Evaluation, MMTGrade } from '@/features/evaluations/domain/types'
import { LoadingScreen } from '@/components/loading-screen'

type PageProps = { params: Promise<{ id: string; evaluationId: string }> }

export default function EditEvaluationPage({ params }: PageProps) {
  const { id: patientId, evaluationId } = use(params)
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null | undefined>(undefined)
  const [evaluation, setEvaluation] = useState<Evaluation | null | undefined>(undefined)

  useEffect(() => {
    async function load() {
      setPatient(await getPatient(patientId))
      setEvaluation(await getEvaluation(evaluationId))
    }
    load()
  }, [patientId, evaluationId])

  async function handleSubmit(values: EvaluationFormValues) {
    const result = await updateEvaluation(evaluationId, patientId, {
      date: values.date,
      // vas는 EvaluationForm의 submitWithVas wrapper가 painMapping.intensity의 max로 자동 산출해서 채워줌
      vas: values.vas,
      rom: values.toggleRom ? values.rom : undefined,
      mmt: values.toggleMmt
        ? values.mmt.map((m) => ({ ...m, grade: m.grade as MMTGrade }))
        : undefined,
      bodyMeasurement: values.toggleMeasurement ? values.measurement : undefined,
      painMapping: values.togglePainMapping ? values.painMapping : undefined,
      custom: values.toggleCustom ? values.custom : undefined,
    })
    
    if (result.success) {
      toast.success('검사 수정됨')
      router.replace(`/patients/${patientId}?tab=evaluations`)
    } else {
      toast.error('검사 기록 수정 실패', { description: result.error })
    }
  }

  if (patient === undefined || evaluation === undefined) {
    return <LoadingScreen />
  }

  if (patient === null || evaluation === null) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        검사 정보를 찾을 수 없습니다.
      </div>
    )
  }

  const defaultValues: Partial<EvaluationFormValues> = {
    date: evaluation.date,
    // 기존 vas는 form state에 들어가지만 사용자가 painMapping을 수정하고 저장하면 자동 산출로 덮어씀
    vas: evaluation.vas ?? undefined,
    toggleRom: evaluation.rom != null && evaluation.rom.length > 0,
    rom: (evaluation.rom ?? []) as EvaluationFormValues['rom'],
    toggleMmt: evaluation.mmt != null && evaluation.mmt.length > 0,
    mmt: (evaluation.mmt ?? []) as EvaluationFormValues['mmt'],
    toggleMeasurement: evaluation.bodyMeasurement != null && evaluation.bodyMeasurement.length > 0,
    measurement: evaluation.bodyMeasurement ?? [],
    toggleCustom: evaluation.custom != null && evaluation.custom.length > 0,
    custom: evaluation.custom ?? [],
    togglePainMapping: evaluation.painMapping != null && evaluation.painMapping.length > 0,
    painMapping: evaluation.painMapping ?? [],
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
      <header className="flex items-center gap-2">
        <Link
          href={`/patients/${patientId}?tab=evaluations`}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">검사 수정</h1>
          <p className="truncate text-sm text-muted-foreground">{patient.name}</p>
        </div>
      </header>

      <EvaluationForm
        patientGender={patient.gender}
        defaultValues={defaultValues}
        submitLabel="수정 완료"
        onSubmit={handleSubmit}
        onCancel={() => router.replace(`/patients/${patientId}?tab=evaluations`)}
      />
    </div>
  )
}
