'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { EvaluationForm } from '@/features/evaluations/components/EvaluationForm'
import { updateEvaluation } from '@/lib/supabase/evaluations'
import type { EvaluationFormValues } from '@/features/evaluations/domain/schema'
import type { Patient } from '@/features/patients/domain/types'
import type { Evaluation, MMTGrade } from '@/features/evaluations/domain/types'

type Props = { patient: Patient; evaluation: Evaluation }

export function EditEvaluationView({ patient, evaluation }: Props) {
  const router = useRouter()
  const [isBackPending, startBackTransition] = useTransition()

  async function handleSubmit(values: EvaluationFormValues) {
    const result = await updateEvaluation(evaluation.id, patient.id, {
      date: values.date,
      // vas는 EvaluationForm submitWithVas wrapper가 painMapping.intensity의 max로 자동 산출
      vas: values.vas,
      rom: values.toggleRom ? values.rom : undefined,
      mmt: values.toggleMmt
        ? values.mmt.map((m) => ({ ...m, grade: m.grade as MMTGrade }))
        : undefined,
      bodyMeasurement: values.toggleMeasurement ? values.measurement : undefined,
      painMapping: values.togglePainMapping ? values.painMapping : undefined,
      custom: values.toggleCustom ? values.custom : undefined,
    })

    if (!result.success) {
      toast.error('검사 기록 수정 실패', { description: result.error })
      return
    }
    toast.success('검사 수정됨')
    router.replace(`/patients/${patient.id}?tab=evaluations`)
    // 페이지 unmount까지 isSubmitting 유지 — 버튼 깜빡임 방지
    await new Promise(() => {})
  }

  const defaultValues: Partial<EvaluationFormValues> = {
    date: evaluation.date,
    vas: evaluation.vas ?? undefined,
    toggleRom: evaluation.rom != null && evaluation.rom.length > 0,
    rom: (evaluation.rom ?? []) as EvaluationFormValues['rom'],
    toggleMmt: evaluation.mmt != null && evaluation.mmt.length > 0,
    mmt: (evaluation.mmt ?? []) as EvaluationFormValues['mmt'],
    toggleMeasurement:
      evaluation.bodyMeasurement != null &&
      evaluation.bodyMeasurement.length > 0,
    measurement: evaluation.bodyMeasurement ?? [],
    toggleCustom: evaluation.custom != null && evaluation.custom.length > 0,
    custom: evaluation.custom ?? [],
    togglePainMapping:
      evaluation.painMapping != null && evaluation.painMapping.length > 0,
    painMapping: evaluation.painMapping ?? [],
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            startBackTransition(() =>
              router.push(`/patients/${patient.id}?tab=evaluations`)
            )
          }
          disabled={isBackPending}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-muted disabled:opacity-60"
        >
          {isBackPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowLeft className="h-5 w-5" />
          )}
        </button>
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
        onCancel={() =>
          router.replace(`/patients/${patient.id}?tab=evaluations`)
        }
      />
    </div>
  )
}
