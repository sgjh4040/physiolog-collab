'use client'

import { FormProvider, useForm, useFormContext, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ROMInput } from './ROMInput'
import { MMTInput } from './MMTInput'
import { MeasurementInput } from './MeasurementInput'
import { BodyMap } from './BodyMap'
import { CustomInput } from './CustomInput'
import { toISODate } from '@/lib/utils/date'
import {
  evaluationFormSchema,
  type EvaluationFormValues,
} from '@/features/evaluations/domain/schema'
import { Loader2 } from 'lucide-react'

type ToggleName =
  | 'toggleRom'
  | 'toggleMmt'
  | 'toggleMeasurement'
  | 'togglePainMapping'
  | 'toggleCustom'

const EMPTY_DEFAULTS: EvaluationFormValues = {
  date: toISODate(),
  toggleRom: false,
  rom: [],
  toggleMmt: false,
  mmt: [],
  toggleMeasurement: false,
  measurement: [],
  togglePainMapping: true,
  painMapping: [],
  toggleCustom: false,
  custom: [],
}

type Props = {
  defaultValues?: Partial<EvaluationFormValues>
  submitLabel?: string
  onSubmit: (values: EvaluationFormValues) => void | Promise<void>
  onCancel?: () => void
  patientGender?: 'male' | 'female'
}

export function EvaluationForm({
  defaultValues,
  submitLabel = '저장',
  onSubmit,
  onCancel,
  patientGender,
}: Props) {
  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationFormSchema),
    defaultValues: { ...EMPTY_DEFAULTS, ...defaultValues },
    mode: 'onSubmit',
  })

  const errors = form.formState.errors

  // 통증 부위가 1개 이상이면 가장 아픈 강도(max)를 vas로 자동 산출.
  // 빈 배열이면 0 (통증 없음). 결과는 onSubmit 콜백으로 그대로 흘러가 caller가 DB에 저장.
  const submitWithVas = (values: EvaluationFormValues) => {
    const computedVas =
      values.painMapping.length > 0
        ? Math.max(...values.painMapping.map((p) => p.intensity))
        : 0
    return onSubmit({ ...values, vas: computedVas })
  }

  /**
   * 필수 항목 미입력 시 폰에서 키보드 안 떠 인지 어려운 문제 해결 — toast로 알림.
   */
  const handleInvalid = (errors: FieldErrors<EvaluationFormValues>) => {
    const firstMessage = Object.values(errors)
      .map((e) => (e && typeof e === 'object' && 'message' in e ? e.message : null))
      .find((m): m is string => typeof m === 'string')
    toast.error('필수 항목을 확인하세요', {
      description: firstMessage ?? '빨간색으로 표시된 부분을 확인해주세요',
    })
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(submitWithVas, handleInvalid)}
        className="flex flex-col gap-5 pb-24"
      >
        <section className="flex flex-col gap-2">
          <Label className="text-base font-semibold">평가 날짜</Label>
          <Input
            type="date"
            className="max-w-[180px]"
            {...form.register('date')}
          />
          {errors.date && (
            <p className="text-sm text-destructive">{errors.date.message}</p>
          )}
        </section>

        <Separator />

        <ToggleSection
          title="ROM (관절가동범위)"
          subtitle="주요 관절·동작별 각도"
          name="toggleRom"
        >
          <ROMInput />
        </ToggleSection>

        <ToggleSection
          title="MMT (도수근력)"
          subtitle="근육별 0~5등급"
          name="toggleMmt"
        >
          <MMTInput />
        </ToggleSection>

        <ToggleSection
          title="신체 계측"
          subtitle="둘레 · 길이 · 부종"
          name="toggleMeasurement"
        >
          <MeasurementInput />
        </ToggleSection>

        <ToggleSection
          title="커스텀 평가"
          subtitle="특수검사 등 자유 평가입력"
          name="toggleCustom"
        >
          <CustomInput />
        </ToggleSection>

        <ToggleSection
          title="통증"
          subtitle="통증 부위 및 양상 — VAS는 자동 산출"
          name="togglePainMapping"
          required
        >
          <BodyMap
            value={form.watch('painMapping')}
            onChange={(v) => form.setValue('painMapping', v, { shouldDirty: true })}
            gender={patientGender}
          />
        </ToggleSection>

        {errors.togglePainMapping?.message && (
          <p className="text-sm text-destructive">
            {String(errors.togglePainMapping.message)}
          </p>
        )}

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

function ToggleSection({
  title,
  subtitle,
  name,
  required,
  children,
}: {
  title: string
  subtitle?: string
  name: ToggleName
  required?: boolean
  children: React.ReactNode
}) {
  const { watch, setValue } = useFormContext<EvaluationFormValues>()
  const enabled = watch(name)
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <Label className="text-base font-semibold">{title}</Label>
            {required && <span className="text-destructive font-bold text-lg leading-none">*</span>}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) =>
            setValue(name, checked, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
      </div>
      {enabled && <div className="mt-2">{children}</div>}
    </section>
  )
}
