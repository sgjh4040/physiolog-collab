'use client'

import { useEffect } from 'react'
import { FormProvider, useForm, type FieldErrors, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { BodyPartSelector } from './BodyPartSelector'
import { MethodSelector } from './MethodSelector'
import { ExerciseSection } from './ExerciseSection'
import { FlagSelector } from './FlagSelector'
import { toISODate } from '@/lib/utils/date'
import {
  treatmentFormSchema,
  type TreatmentFormValues,
} from '@/features/treatments/domain/schema'
import { Loader2 } from 'lucide-react'

type Props = {
  defaultValues?: Partial<TreatmentFormValues>
  submitLabel?: string
  onSubmit: (values: TreatmentFormValues) => void | Promise<void>
  onCancel?: () => void
}

const EMPTY_DEFAULTS: TreatmentFormValues = {
  date: toISODate(),
  bodyParts: [],
  methods: [],
  exerciseConcept: undefined,
  exercises: [],
  homework: '',
  comment: '',
  flags: [],
}

export function TreatmentForm({
  defaultValues,
  submitLabel = '저장',
  onSubmit,
  onCancel,
}: Props) {
  const form = useForm<TreatmentFormValues>({
    // zod 4.x + react-hook-form 7.x 호환성 이슈 — 정확한 타입은 zod typeof 추론과
    // resolver 제네릭 미스매치라 known issue. https://github.com/react-hook-form/resolvers/issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(treatmentFormSchema) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: { ...EMPTY_DEFAULTS, ...defaultValues } as any,
    mode: 'onSubmit',
  })

  // 비동기로 넘어온 defaultValues를 반영하기 위해 reset 사용
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.reset({ ...EMPTY_DEFAULTS, ...defaultValues } as any)
    }
  }, [defaultValues, form])

  const handleFormSubmit: SubmitHandler<TreatmentFormValues> = async (values) => {
    await onSubmit(values)
  }

  /**
   * 필수 항목 미입력 시 폰에서 키보드 안 떠 인지 어려운 문제 해결 — toast로 알림.
   * RHF의 shouldFocusError(default true)는 focus만, 시각 피드백 부족.
   */
  const handleInvalid = (errors: FieldErrors<TreatmentFormValues>) => {
    const firstMessage = Object.values(errors)
      .map((e) => (e && typeof e === 'object' && 'message' in e ? e.message : null))
      .find((m): m is string => typeof m === 'string')
    toast.error('필수 항목을 확인하세요', {
      description: firstMessage ?? '빨간색으로 표시된 부분을 확인해주세요',
    })
  }

  const methods = form.watch('methods')
  const showExercise = methods?.includes('exercise')

  const errors = form.formState.errors

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit, handleInvalid)}
        className="flex flex-col gap-6 pb-24"
      >
        <Section title="치료 날짜">
          <Input
            type="date"
            className="max-w-[180px]"
            {...form.register('date')}
          />
          {errors.date && (
            <p className="text-sm text-destructive">{errors.date.message}</p>
          )}
        </Section>

        <Separator />

        <Section title="치료 부위" subtitle="여러 부위 선택 가능 · 위에서 아래 순서" required>
          <BodyPartSelector />
          {errors.bodyParts && typeof errors.bodyParts.message === 'string' && (
            <p className="text-sm text-destructive">
              {errors.bodyParts.message}
            </p>
          )}
        </Section>

        <Separator />

        <Section title="치료 방법" subtitle="여러 개 선택 가능" required>
          <MethodSelector />
          {errors.methods && typeof errors.methods.message === 'string' && (
            <p className="text-sm text-destructive">{errors.methods.message}</p>
          )}
        </Section>

        {/* 운동치료를 치료방법 직후로 — 사용자가 '운동치료' 체크 → 바로 아래에서 목적·운동 추가 */}
        {showExercise && (
          <>
            <Separator />
            <Section title="운동치료" subtitle="목적 선택 + 운동 추가" optional>
              <ExerciseSection />
            </Section>
          </>
        )}

        <Separator />

        <Section title="오늘의 특이사항" subtitle="델타 플래그 · AI 재평가 요약에 활용됩니다" optional>
          <FlagSelector />
        </Section>

        <Separator />

        <Section title="숙제" subtitle="과제·운동 등" optional>
          <Textarea
            rows={3}
            placeholder="예: 집에서 아침/저녁으로 폼롤러 스트레칭 10분 수행"
            {...form.register('homework')}
          />
        </Section>

        <Separator />

        <Section title="당일 코멘트" subtitle="환자 반응·특이사항" optional>
          <Textarea
            rows={4}
            placeholder="예: 통증 호소 줄어듦. 다음 회기엔 코어 안정화 추가 예정."
            {...form.register('comment')}
          />
        </Section>

        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-2xl gap-2 p-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onCancel}
                disabled={form.formState.isSubmitting}
              >
                취소
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}

function Section({
  title,
  subtitle,
  required,
  optional,
  children,
}: {
  title: string
  subtitle?: string
  required?: boolean
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <div className="flex items-center gap-1.5">
          <Label className="text-base font-semibold">{title}</Label>
          {required && <span className="text-destructive font-bold text-lg leading-none">*</span>}
          {optional && <span className="text-[10px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded leading-none">선택사항</span>}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  )
}
