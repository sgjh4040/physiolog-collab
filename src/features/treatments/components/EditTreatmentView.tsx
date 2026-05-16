'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { TreatmentForm } from '@/features/treatments/components/TreatmentForm'
import { updateTreatment } from '@/lib/supabase/treatments'
import type { TreatmentFormValues } from '@/features/treatments/domain/schema'
import type { Patient } from '@/features/patients/domain/types'
import type { Treatment } from '@/features/treatments/domain/types'

type Props = { patient: Patient; treatment: Treatment }

export function EditTreatmentView({ patient, treatment }: Props) {
  const router = useRouter()
  const [isBackPending, startBackTransition] = useTransition()

  async function handleSubmit(values: TreatmentFormValues) {
    const result = await updateTreatment(treatment.id, patient.id, {
      date: values.date,
      bodyParts: values.bodyParts,
      methods: values.methods,
      otherTreatmentMethod: values.otherTreatmentMethod,
      methodDetails: values.methodDetails,
      exerciseConcept: values.exerciseConcept,
      exercises: values.exercises,
      homework: values.homework,
      comment: values.comment,
      flags: values.flags,
    })
    if (!result.success) {
      toast.error('수정 실패', { description: result.error })
      return
    }
    toast.success('치료 수정됨')
    router.replace(`/patients/${patient.id}?tab=treatments`)
    // 페이지 unmount까지 isSubmitting 유지 — 버튼 깜빡임 방지
    await new Promise(() => {})
  }

  const defaultValues: Partial<TreatmentFormValues> = {
    date: treatment.date,
    bodyParts: treatment.bodyParts as TreatmentFormValues['bodyParts'],
    methods: treatment.methods,
    otherTreatmentMethod: treatment.otherTreatmentMethod ?? undefined,
    // 도수치료·초음파 등 method별 메모. 누락 시 사용자 입력 손실 우려로 필수 복원.
    // zod record inference와 Treatment 타입 키 optionality 차이로 cast.
    methodDetails: treatment.methodDetails as TreatmentFormValues['methodDetails'],
    exerciseConcept: treatment.exerciseConcept ?? undefined,
    exercises: (treatment.exercises ?? []) as TreatmentFormValues['exercises'],
    homework: treatment.homework ?? '',
    comment: treatment.comment ?? '',
    flags: treatment.flags ?? [],
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            startBackTransition(() =>
              router.push(`/patients/${patient.id}?tab=treatments`)
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
          <h1 className="text-xl font-semibold">치료 수정</h1>
          <p className="truncate text-sm text-muted-foreground">{patient.name}</p>
        </div>
      </header>

      <TreatmentForm
        defaultValues={defaultValues}
        submitLabel="수정 완료"
        onSubmit={handleSubmit}
        onCancel={() =>
          router.replace(`/patients/${patient.id}?tab=treatments`)
        }
      />
    </div>
  )
}
