import { z } from 'zod'

const sideEnum = z.enum(['left', 'right', 'both'])

export const romRecordSchema = z.object({
  jointId: z.string().min(1),
  side: sideEnum,
  active: z.number().optional(),
  passive: z.number().optional(),
})

export const mmtRecordSchema = z.object({
  jointId: z.string().min(1),
  side: sideEnum,
  grade: z.number().int().min(0).max(5),
})

export const bodyMeasurementSchema = z.object({
  type: z.enum(['circumference', 'length', 'edema']),
  location: z.string().trim().min(1, '부위를 입력하세요'),
  value: z.number().nonnegative(),
  unit: z.enum(['cm', 'mm']),
})

export const customEvalSchema = z.object({
  name: z.string().trim().min(1, '항목명을 입력하세요'),
  value: z.string().trim().min(1, '값을 입력하세요'),
})

export const painAreaSchema = z.object({
  id: z.string(),
  label: z.string(),
  pattern: z.enum(['referred', 'tingling', 'weakness', 'paresthesia', 'radiating', 'sharp', 'custom']),
  intensity: z.number().min(0).max(10),
  customPatternLabel: z.string().optional(),
  radiationTo: z.array(z.string()).optional(),
})

export const evaluationFormSchema = z
  .object({
    date: z.string().min(1, '날짜를 선택하세요'),
    // vas는 사용자 직접 입력이 아니라 submit 시점에 painMapping[].intensity의 max로 자동 산출됨.
    // optional 유지: form 내부에서는 비어있고, EvaluationForm의 submitWithVas wrapper가 채워서 onSubmit에 전달.
    vas: z.number().int().min(0).max(10).optional(),
    toggleRom: z.boolean(),
    rom: z.array(romRecordSchema),
    toggleMmt: z.boolean(),
    mmt: z.array(mmtRecordSchema),
    toggleMeasurement: z.boolean(),
    measurement: z.array(bodyMeasurementSchema),
    togglePainMapping: z.boolean(),
    painMapping: z.array(painAreaSchema),
    toggleCustom: z.boolean(),
    custom: z.array(customEvalSchema),
  })
  .refine(
    (d) =>
      d.toggleRom ||
      d.toggleMmt ||
      d.toggleMeasurement ||
      d.togglePainMapping ||
      d.toggleCustom,
    {
      message: '측정한 항목을 1개 이상 켜세요',
      path: ['togglePainMapping'],
    },
  )
  .refine((d) => !d.toggleRom || d.rom.length > 0, {
    message: 'ROM 항목을 1개 이상 추가하세요',
    path: ['rom'],
  })
  .refine((d) => !d.toggleMmt || d.mmt.length > 0, {
    message: 'MMT 항목을 1개 이상 추가하세요',
    path: ['mmt'],
  })
  .refine((d) => !d.toggleMeasurement || d.measurement.length > 0, {
    message: '신체 계측 항목을 1개 이상 추가하세요',
    path: ['measurement'],
  })
  .refine((d) => !d.toggleCustom || d.custom.length > 0, {
    message: '커스텀 검사 항목을 1개 이상 추가하세요',
    path: ['custom'],
  })

export type EvaluationFormValues = z.infer<typeof evaluationFormSchema>
