'use client'

import { useFormContext } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { TREATMENT_METHOD_OPTIONS, TREATMENT_METHOD_LABEL } from '@/data/treatment-options'
import type { TreatmentMethod } from '@/features/treatments/domain/types'
import type { TreatmentFormValues } from '@/features/treatments/domain/schema'

// 메서드별 placeholder 힌트 (입력 가이드). 'exercise'는 운동 카드로 자세 입력 → 별도 textarea 없음
const METHOD_DETAIL_PLACEHOLDER: Partial<Record<TreatmentMethod, string>> = {
  manual: '예: 우측 어깨 강도 중',
  electric: '예: TENS 15분',
  ultrasound: '예: 5분 1MHz',
  thermal: '예: 온찜질 10분',
  task: '예: 보행 30보 × 3세트',
}

export function MethodSelector() {
  const { watch, setValue, register } = useFormContext<TreatmentFormValues>()
  const selected = watch('methods') ?? []
  // 운동치료는 운동 카드로 자세 입력하므로 상세 메모 textarea 안 보임
  const detailMethods = selected.filter((m): m is Exclude<TreatmentMethod, 'exercise'> => m !== 'exercise')

  const toggle = (m: TreatmentMethod) => {
    if (selected.includes(m)) {
      setValue(
        'methods',
        selected.filter((s) => s !== m),
        { shouldDirty: true, shouldValidate: true },
      )
    } else {
      setValue('methods', [...selected, m], {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {TREATMENT_METHOD_OPTIONS.map((opt) => {
          const isOn = selected.includes(opt.value)
          return (
            <Label
              key={opt.value}
              htmlFor={`method-${opt.value}`}
              className={
                isOn
                  ? 'flex cursor-pointer items-center gap-2 rounded-md border border-primary bg-primary/5 px-3 py-2'
                  : 'flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 hover:bg-accent'
              }
            >
              <Checkbox
                id={`method-${opt.value}`}
                checked={isOn}
                onCheckedChange={() => toggle(opt.value)}
              />
              <span className="select-none text-sm font-medium">
                {opt.label}
              </span>
            </Label>
          )
        })}
      </div>

      {/* 선택된 메서드(운동 제외)에 대해 상세 메모 — 안 써도 OK */}
      {detailMethods.length > 0 && (
        <div className="flex flex-col gap-2">
          {detailMethods.map((m) => {
            // 'other'는 legacy 컬럼(otherTreatmentMethod) 호환 위해 별도 처리
            const placeholder = METHOD_DETAIL_PLACEHOLDER[m] ?? '직접 입력'
            return (
              <div key={m} className="flex flex-col gap-1">
                <Label
                  htmlFor={`detail-${m}`}
                  className="text-xs text-muted-foreground"
                >
                  {TREATMENT_METHOD_LABEL[m]} 상세{' '}
                  <span className="text-muted-foreground/60">(선택)</span>
                </Label>
                <Input
                  id={`detail-${m}`}
                  placeholder={placeholder}
                  className="h-9"
                  {...register(
                    m === 'other'
                      ? 'otherTreatmentMethod'
                      : (`methodDetails.${m}` as const)
                  )}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
