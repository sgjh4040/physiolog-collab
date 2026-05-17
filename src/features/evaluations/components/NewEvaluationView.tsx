'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { EvaluationForm } from '@/features/evaluations/components/EvaluationForm'
import { evaluationFavoritesStore } from '@/lib/storage'
import { createEvaluation } from '@/lib/supabase/evaluations'
import { toISODate } from '@/lib/utils/date'
import type { EvaluationFormValues } from '@/features/evaluations/domain/schema'
import type { Patient } from '@/features/patients/domain/types'
import type { Evaluation, EvaluationInput, MMTGrade } from '@/features/evaluations/domain/types'

type Props = {
  patient: Patient
  sourceRecord: Evaluation | null
  copyMode: boolean
}

export function NewEvaluationView({ patient, sourceRecord, copyMode }: Props) {
  const router = useRouter()

  async function handleSubmit(values: EvaluationFormValues) {
    const input: EvaluationInput = {
      patientId: patient.id,
      date: values.date,
      // vas는 EvaluationForm의 submitWithVas wrapper가 painMapping.intensity의 max로 자동 산출
      vas: values.vas,
      rom: values.toggleRom ? values.rom : undefined,
      mmt: values.toggleMmt
        ? values.mmt.map((m) => ({ ...m, grade: m.grade as MMTGrade }))
        : undefined,
      bodyMeasurement: values.toggleMeasurement ? values.measurement : undefined,
      painMapping: values.togglePainMapping ? values.painMapping : undefined,
      custom: values.toggleCustom ? values.custom : undefined,
    }

    const result = await createEvaluation(input)

    if (!result.success) {
      toast.error('검사 기록 저장 실패', { description: result.error })
      return
    }
    if (values.toggleCustom && values.custom) {
      values.custom.forEach((c) => {
        if (c.name.trim()) {
          evaluationFavoritesStore.recordEvaluationUsage(c.name)
        }
      })
    }
    toast.success(copyMode ? '복사 저장 완료' : '검사 저장됨')
    router.replace(`/patients/${patient.id}?tab=evaluations`)
    // 페이지 unmount까지 isSubmitting 유지 — 버튼 깜빡임 방지
    await new Promise(() => {})
  }

  // 복사 모드면 sourceRecord로 prefill, 일반 작성이면 빈 폼.
  // 날짜는 항상 오늘로 갱신 — 재평가이므로 이전 날짜를 복사하지 않음.
  const defaults: Partial<EvaluationFormValues> | undefined = sourceRecord
    ? {
        date: toISODate(),
        toggleRom: sourceRecord.rom != null && sourceRecord.rom.length > 0,
        rom: (sourceRecord.rom ?? []) as EvaluationFormValues['rom'],
        toggleMmt: sourceRecord.mmt != null && sourceRecord.mmt.length > 0,
        mmt: (sourceRecord.mmt ?? []) as EvaluationFormValues['mmt'],
        toggleMeasurement:
          sourceRecord.bodyMeasurement != null &&
          sourceRecord.bodyMeasurement.length > 0,
        measurement: sourceRecord.bodyMeasurement ?? [],
        toggleCustom: sourceRecord.custom != null && sourceRecord.custom.length > 0,
        custom: sourceRecord.custom ?? [],
        togglePainMapping:
          sourceRecord.painMapping != null && sourceRecord.painMapping.length > 0,
        painMapping: sourceRecord.painMapping ?? [],
      }
    : undefined

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
      <header className="flex items-center gap-2">
        <Link
          href={`/patients/${patient.id}?tab=evaluations`}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">검사 {copyMode ? '복사' : '입력'}</h1>
          <p className="truncate text-sm text-muted-foreground">{patient.name}</p>
        </div>
        {copyMode && (
          <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs">
            <Copy className="h-3 w-3" />
            이전 기록 복사
          </span>
        )}
      </header>

      <EvaluationForm
        patientGender={patient.gender}
        defaultValues={defaults}
        submitLabel={copyMode ? '복사 저장' : '저장'}
        onSubmit={handleSubmit}
        onCancel={() => router.replace(`/patients/${patient.id}?tab=evaluations`)}
      />
    </div>
  )
}
